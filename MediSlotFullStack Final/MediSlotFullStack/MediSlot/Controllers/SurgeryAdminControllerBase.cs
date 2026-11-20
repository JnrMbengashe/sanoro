using Microsoft.AspNetCore.Mvc;

namespace MediSlot.Controllers
{
    public abstract class SurgeryAdminControllerBase : ControllerBase
    {
        // The surgery this admin manages, read from their login token.
        protected int? CurrentSurgeryId =>
            int.TryParse(User.FindFirst("surgeryId")?.Value, out var id) ? id : null;
    }
}