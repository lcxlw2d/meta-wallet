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

export const setCurrentNetwork = async (network: string) => {
  try {
    localStorage.setItem("currentNetwork", network)
  } catch (error) {
    // console.error("Error setting current network:", error)
  }
  storage.setItem("currentNetwork", network)
}

export const getCurrentNetwork = async () => {
  try {
    const network = await storage.getItem("currentNetwork")
    if (network) {
      return network
    }
  } catch (error) {
    // console.error("Error getting current network:", error)
  }
  return await storage.getItem("currentNetwork")
}
