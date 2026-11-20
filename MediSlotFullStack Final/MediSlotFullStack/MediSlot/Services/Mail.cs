using System.Threading.Channels;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace MediSlot.Services
{
    public record MailMessage(string ToName, string ToAddress, string Subject, string Body);

    public interface IMailSender
    {
        Task SendAsync(MailMessage message, CancellationToken cancellationToken);
    }

    // Test mode: prints the email in the API's console instead of sending it.
    public class LogMailSender : IMailSender
    {
        private readonly ILogger<LogMailSender> _logger;

        public LogMailSender(ILogger<LogMailSender> logger)
        {
            _logger = logger;
        }

        public Task SendAsync(MailMessage message, CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "EMAIL (test mode, not sent)\nTo: {Name} <{Address}>\nSubject: {Subject}\n\n{Body}\n",
                message.ToName, message.ToAddress, message.Subject, message.Body);
            return Task.CompletedTask;
        }
    }

    // Real mode: sends through an SMTP server.
    public class SmtpMailSender : IMailSender
    {
        private readonly IConfiguration _config;

        public SmtpMailSender(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendAsync(MailMessage message, CancellationToken cancellationToken)
        {
            var mime = new MimeMessage();
            mime.From.Add(new MailboxAddress(_config["Email:FromName"], _config["Email:FromAddress"]));
            mime.To.Add(new MailboxAddress(message.ToName, message.ToAddress));
            mime.Subject = message.Subject;
            mime.Body = new TextPart("plain") { Text = message.Body };

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _config["Email:SmtpHost"],
                int.Parse(_config["Email:SmtpPort"] ?? "587"),
                SecureSocketOptions.StartTls,
                cancellationToken);
            await client.AuthenticateAsync(_config["Email:SmtpUser"], _config["Email:SmtpPassword"], cancellationToken);
            await client.SendAsync(mime, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
    }

    // The waiting line for emails. Adding to it is instant.
    public class MailQueue
    {
        private readonly Channel<MailMessage> _channel = Channel.CreateUnbounded<MailMessage>();

        public ChannelReader<MailMessage> Reader => _channel.Reader;

        public void Enqueue(MailMessage message)
        {
            _channel.Writer.TryWrite(message);
        }
    }

    // Takes emails off the queue and sends them, trying up to 3 times.
    public class MailWorker : BackgroundService
    {
        private readonly MailQueue _queue;
        private readonly IMailSender _sender;
        private readonly ILogger<MailWorker> _logger;

        public MailWorker(MailQueue queue, IMailSender sender, ILogger<MailWorker> logger)
        {
            _queue = queue;
            _sender = sender;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                await foreach (var message in _queue.Reader.ReadAllAsync(stoppingToken))
                {
                    for (var attempt = 1; attempt <= 3; attempt++)
                    {
                        try
                        {
                            await _sender.SendAsync(message, stoppingToken);
                            break;
                        }
                        catch (Exception ex) when (ex is not OperationCanceledException)
                        {
                            _logger.LogWarning(ex, "Sending an email failed (attempt {Attempt} of 3).", attempt);
                            if (attempt < 3)
                            {
                                await Task.Delay(TimeSpan.FromSeconds(5 * attempt), stoppingToken);
                            }
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // The app is shutting down.
            }
        }
    }
}