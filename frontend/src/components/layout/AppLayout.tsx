import { Outlet } from 'react-router-dom';
import { AppContextProvider } from '../../context/AppContextProvider';

export function AppLayout() {
  return (
    <AppContextProvider>
      <Outlet />
    </AppContextProvider>
  );
}

export default AppLayout;

