import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { db } from '../db/firebase';
import { ArrowLeft } from "lucide-react";
import { doc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AddTarget() {
    const [targetType, setTargetType] = useState('monthly');
    const [targetValue, setTargetValue] = useState();
    const navigate = useNavigate();


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const targetDocRef = doc(db, 'target', "xphMBG25JWI1MhzVm5dr");

            if(targetType == "monthly") {
                await updateDoc(targetDocRef, { monthly: targetValue });
            }else if(targetType == "daily") {
                await updateDoc(targetDocRef, { daily: targetValue });
            }else {
                await updateDoc(targetDocRef, { shift: targetValue });
            }

            toast.success('Target updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            navigate('/dashboard');
        } catch (error) {
            console.error('Error updating target:', error);
            toast.error('Failed to update target.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

            <h2 className="text-2xl font-bold mb-4">Set Target</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Select onValueChange={setTargetType} defaultValue={targetType}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Target Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="shift">Shift</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="target" className="block text-lg font-semibold">Target</label>
                    <Input
                        id="produced"
                        type="number"
                        placeholder="Enter number of items produced"
                        value={targetValue}
                        onChange={(e) => setTargetValue(Number(e.target.value))} 
                        required
                    />
                </div>
                <Button type="submit" className="w-full">Update Target</Button>
            </form>
        </div>
        </div>
    );
}
