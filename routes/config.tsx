// route config
import ImportPage from '~pages/importPage';
import HomePage from '../pages/homePage';
import WalletPage from '~pages/walletPage';
import type { RouteObject } from "react-router-dom"

const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "import", element: <ImportPage /> },
  { path: "/wallet", element: <WalletPage /> }
]
export default routes