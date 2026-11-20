# MediSlot (Phase 2: Surgeries, Doctors, Appointment types)

Follows the IWDV202 guide, Parts 1 to 10: ASP.NET Core Web API + EF Core (Code First) + SQL Server, with a React frontend.

```
MediSlotFullStack/
  MediSlot/              ASP.NET Core Web API (.NET 10)
  medislot-frontend/     React app (create-react-app, as in the guide)
```

## 1. Backend

1. Open `MediSlot/appsettings.json` and set the server name in `MediSlotConnection` to the one shown in SSMS.
   Write a backslash as `\\` (for example `DESKTOP-ABC\\SQLEXPRESS`).
2. In a terminal, inside the `MediSlot` folder:
   ```
   dotnet tool install --global dotnet-ef
   dotnet ef migrations add AddDoctorsAndAppointmentTypes
   dotnet ef database update
   dotnet run
   ```
   If `dotnet-ef` is already installed, skip the first line. If you already ran `InitialCreate`, keep it:
   the new migration only adds the two new tables.
4. Open http://localhost:5000/swagger and test the five endpoints (GET all, GET one, POST, PUT, DELETE).
   In SSMS you should see the `MediSlotDB` database with a `Surgeries` table.

## 2. Frontend

In a second terminal, inside `medislot-frontend`:
```
npm install
npm start
```
The app opens at http://localhost:3000. Keep the backend running.

## Names used
Doctor and AppointmentType belong to a Surgery through `SurgeryId` (one surgery, many doctors and appointment types).
Backend project and namespace `MediSlot`, context `MediSlotContext`, entity `Surgery`, controller `SurgeriesController`,
database `MediSlotDB`, connection string `MediSlotConnection`, React component `SurgeryCrud`.

## Next phases
Doctor weekly schedules, then login and roles, then booking with time slots.
