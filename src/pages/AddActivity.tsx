import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { Textarea } from "@/components/ui/textarea"; 
import { ArrowLeft } from "lucide-react";
// import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { db } from '../db/firebase'; 
import { collection, addDoc } from 'firebase/firestore';

export default function AddActivity() {
    const [activityMessage, setActivityMessage] = useState("");
    const navigate = useNavigate();
    // const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const currentTime = dayjs().format('h:mm A');

        try {
            await addDoc(collection(db, "comments"), {
                activityMessage,
                currentTime
            });
            toast.success('Data added and OEE updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
    
            navigate('/dashboard');
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error('Something went wrong: ' + error.message, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                toast.error('An unknown error occurred.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        }


    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pt-16">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">

                <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                <h1 className="text-2xl font-bold mb-6">Add Comment</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Textarea
                            rows={4}
                            placeholder="Enter maintenance activity"
                            value={activityMessage}
                            onChange={(e) => setActivityMessage(e.target.value)}
                            required
                            className="w-full resize-none border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2"
                        />
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg">
                        Add Comment
                    </Button>
                </form>
            </div>
        </div>
    );
}
