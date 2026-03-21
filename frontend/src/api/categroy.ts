import { apiClient } from "./client";

export const getCategories = async () => {
    return apiClient.get("/category")
}