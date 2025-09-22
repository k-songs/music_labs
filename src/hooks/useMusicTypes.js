import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useMusicTypes() {
  const queryClient = useQueryClient();
  const [showAddMusicType, setShowAddMusicType] = useState(false);
  const [editingMusicType, setEditingMusicType] = useState(null);
  const [newMusicType, setNewMusicType] = useState({
    name: "",
    description: "",
    file_url: "",
  });

  const { data: musicTypesData } = useQuery({
    queryKey: ["music-types"],
    queryFn: async () => {
      const response = await fetch("/api/music-types");
      if (!response.ok) throw new Error("Failed to fetch music types");
      const data = await response.json();
      return data.musicTypes;
    },
  });

  const addMusicTypeMutation = useMutation({
    mutationFn: async (musicTypeData) => {
      const response = await fetch("/api/music-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(musicTypeData),
      });
      if (!response.ok) throw new Error("Failed to add music type");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["music-types"]);
      setShowAddMusicType(false);
      setNewMusicType({ name: "", description: "", file_url: "" });
    },
  });

  const updateMusicTypeMutation = useMutation({
    mutationFn: async (musicTypeData) => {
      const response = await fetch("/api/music-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(musicTypeData),
      });
      if (!response.ok) throw new Error("Failed to update music type");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["music-types"]);
      setEditingMusicType(null);
    },
  });

  const deleteMusicTypeMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/music-types?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete music type");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["music-types"]);
    },
  });

  const handleAddMusicType = () => {
    addMusicTypeMutation.mutate(newMusicType);
  };

  const handleUpdateMusicType = () => {
    updateMusicTypeMutation.mutate(editingMusicType);
  };

  return {
    musicTypesData,
    showAddMusicType,
    setShowAddMusicType,
    editingMusicType,
    setEditingMusicType,
    newMusicType,
    setNewMusicType,
    addMusicType: handleAddMusicType,
    updateMusicType: handleUpdateMusicType,
    deleteMusicType: deleteMusicTypeMutation.mutate,
    isAddingMusicType: addMusicTypeMutation.isPending,
    isUpdatingMusicType: updateMusicTypeMutation.isPending,
    isDeletingMusicType: deleteMusicTypeMutation.isPending,
  };
}
