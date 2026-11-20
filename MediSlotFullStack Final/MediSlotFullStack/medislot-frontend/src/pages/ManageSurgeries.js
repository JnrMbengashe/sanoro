import { useState } from "react";
import SurgeryCrud from "../SurgeryCrud";
import SurgeryDetails from "../SurgeryDetails";

function ManageSurgeries() {
  const [selectedSurgery, setSelectedSurgery] = useState(null);

  return (
    <div className="container py-4">
      {selectedSurgery ? (
        <SurgeryDetails surgery={selectedSurgery} onBack={() => setSelectedSurgery(null)} />
      ) : (
        <SurgeryCrud onManage={setSelectedSurgery} />
      )}
    </div>
  );
}

export default ManageSurgeries;