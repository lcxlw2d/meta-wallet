import { Storage } from "@plasmohq/storage"

const storage = new Storage({ area: "local" })

export const setItem = async (key: string, value: any) => {
  await storage.setItem(key, value)
}

export const getItem = async (key: string) => {
  return await storage.getItem(key)
}

export const removeItem = async (key: string) => {
  await storage.removeItem(key)
}
