import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, Navigate } from 'react-router-dom';
import ManufacturingDashboard from './pages/ManufacturingDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddMachine from './pages/AddMachine';
import AddActivity from './pages/AddActivity';
import StatusUpdate from './pages/StatusUpdate';
import DowntimUpdate from './pages/DowntimUpdate';
import AddTarget from './pages/AddTarget';
import Signin from './pages/Signin';
import Cookies from 'js-cookie';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { FaAngleDoubleDown } from "react-icons/fa";

// Define User interface
interface User {
  id: string;
  email: string;
  type: string;
}

// Higher-order component for protecting routes
const ProtectedRoute = ({ user, children }: { user: User | null, children: React.ReactNode }) => {
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      setUser(JSON.parse(userCookie) as User);
    }
  }, []);

  const handleLogout = () => {
    if (user) {
      Cookies.remove('user');
      setUser(null);
      navigate('/dashboard');
    }
  };

  return (
    <div>
      {/* Responsive Navbar using Menubar from shadcn/ui */}
      <Menubar className="bg-black text-white px-4 py-6 mx-2">
        <div className="container mx-auto flex justify-between items-center px-4">
          <MenubarMenu>
            <MenubarTrigger className="text-lg font-bold">Menu <FaAngleDoubleDown className='pl-2' /> </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Link to="/dashboard" className="hover:text-gray-400 transition duration-300">Dashboard</Link>
              </MenubarItem>

              {/* Conditionally show operator-specific links */}
              {user && (
                <>
                  <MenubarItem>
                    <Link to="/add-current-prouct" className="hover:text-gray-400 transition duration-300">Add Current Product</Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link to="/add-comment" className="hover:text-gray-400 transition duration-300">Add Comment</Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link to="/status-update" className="hover:text-gray-400 transition duration-300">Update Status</Link>
                  </MenubarItem>
                  <MenubarItem>
                    <Link to="/downtime-update" className="hover:text-gray-400 transition duration-300">Add Downtime</Link>
                  </MenubarItem>
                  {user?.type === 'manager' && (<>
                    <MenubarItem>
                    <Link to="/add-target" className="hover:text-gray-400 transition duration-300">Add Target</Link>
                  </MenubarItem>
                  </>)
                  }
                </>
              )}

            </MenubarContent>
          </MenubarMenu>

          <div>
            {user ? (
              <Button
                onClick={handleLogout}
                className="bg-white hover:bg-gray-300 text-white text-black"
              >
                Logout
              </Button>
            ) : (
              <Button className='bg-white hover:bg-gray-300'>
                <Link to="/signin" className="text-black">
                  Log In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Menubar>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<ManufacturingDashboard />} />
        <Route path="/dashboard" element={<ManufacturingDashboard />} />

        {/* Protected Routes for Operators */}
        <Route
          path="/add-current-prouct"
          element={
            <ProtectedRoute user={user} >
              <AddMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-comment"
          element={
            <ProtectedRoute user={user} >
              <AddActivity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/status-update"
          element={
            <ProtectedRoute user={user} >
              <StatusUpdate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/downtime-update"
          element={
            <ProtectedRoute user={user} >
              <DowntimUpdate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-target"
          element={
            <ProtectedRoute user={user} >
              <AddTarget />
            </ProtectedRoute>
          }
        />

        <Route path="/signin" element={<Signin setUser={setUser} />} />
      </Routes>

      <ToastContainer />
    </div>
  );
}

export default App;
