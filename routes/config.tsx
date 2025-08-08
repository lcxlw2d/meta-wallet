// route config
import ImportPage from '~pages/importPage';
import HomePage from '../pages/homePage';
import WalletPage from '~pages/walletPage';
import CreateWallet from '~pages/createWallet';
import RecoverWalletPage from '~pages/recoverWallet';
import type { RouteObject } from "react-router-dom"

const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "import", element: <ImportPage /> },
  { path: "/wallet", element: <WalletPage /> },
  { path: "/create", element: <CreateWallet /> },
  { path: "/recover", element: <RecoverWalletPage /> },
]
export default routes