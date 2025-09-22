"use client";

import AddUserModal from "./AddUserModal";
import { useScheduleManagement } from "../../hooks/useScheduleManagement";

export default function AddUserModalWrapper({ show, onClose }) {
  const { addUserMutation } = useScheduleManagement();

  return (
    <AddUserModal
      show={show}
      onClose={onClose}
      addUserMutation={addUserMutation}
    />
  );
}
