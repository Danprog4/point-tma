import { useState } from "react";
import { usePeopleActions } from "./usePeopleActions";

export const usePeopleComplaints = (user: any) => {
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaint, setComplaint] = useState("");
  const { submitComplaint, handleUnsendComplaint } = usePeopleActions(user);

  const openComplaintDrawer = (selectedUser: number, isComplainedFlag: boolean) => {
    if (isComplainedFlag) {
      handleUnsendComplaint("user", selectedUser);
    } else {
      setIsComplaintOpen(true);
    }
  };

  const handleSubmitComplaint = (selectedUser: number) => {
    submitComplaint(complaint, "user", selectedUser);
    setIsComplaintOpen(false);
    setComplaint("");
  };

  return {
    isComplaintOpen,
    setIsComplaintOpen,
    complaint,
    setComplaint,
    openComplaintDrawer,
    handleSubmitComplaint,
  };
};
