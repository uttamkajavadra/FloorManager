import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../db/firebase'; // Assume this is your Firebase config
import Cookies from 'js-cookie';

interface UserInfo {
  id: string;
  email: string;
  type: string;
}

interface SigninProps {
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
}

const Signin: React.FC<SigninProps> = ({ setUser }) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const navigate = useNavigate();
    const location = useLocation();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const clearFields = (): void => {
            setEmail("");
            setPassword("");
            if (formRef.current) {
                formRef.current.reset();
            }
        };

        clearFields();

        const timeoutId = setTimeout(() => {
            clearFields();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [location]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (email.length === 0 || password.length === 0) {
            toast.error("All fields are required");
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email), where('password', '==', password));
            const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();

                const userInfo: UserInfo = {
                    id: userDoc.id,
                    email: userData.email,
                    type: userData.type,
                };
            
                Cookies.set('user', JSON.stringify(userInfo), { expires: 1 });
                setUser(userInfo);

                toast.success(`${userData.type} Logged in successfully!`);
                
                navigate('/dashboard');
            } else {
                toast.error("Email or password is incorrect");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            toast.error("Error logging in. Please try again.");
        }

        setEmail("");
        setPassword("");
        if (formRef.current) {
            formRef.current.reset();
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h3 className='text-center text-3xl font-bold'>Log In</h3>
                <form onSubmit={handleSubmit} ref={formRef} autoComplete="off">
                    <div className='my-4'>
                        <Label htmlFor="email" className="text-lg font-semibold">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="text"
                            placeholder="enter email"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            required
                            autoComplete="new-email"
                        />
                    </div>

                    <div className='my-4'>
                        <Label htmlFor="password" className="text-lg font-semibold">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="enter password"
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg my-2">
                        Log In
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default Signin;