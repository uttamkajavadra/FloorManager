
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react";
// import { useNavigate } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '../db/firebase';
import { collection, query, where, updateDoc, getDocs } from 'firebase/firestore';
import DateTimePicker from '../components/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';


export default function DowntimUpdate() {
    const [machine, setMachine] = useState("");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const navigate = useNavigate();
    // const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const calculateTimeDifference = (start: string, end: string): number => {
            const startTime = dayjs(start, 'DD/MM/YYYY HH:mm');
            const endTime = dayjs(end, 'DD/MM/YYYY HH:mm');
    
            return endTime.diff(startTime, 'minute');
        };

        const formattedStartTime = startTime ? dayjs(startTime).format('DD/MM/YYYY HH:mm') : '';
        const formattedEndTime = endTime ? dayjs(endTime).format('DD/MM/YYYY HH:mm') : '';
        const timeDifference = calculateTimeDifference(formattedStartTime, formattedEndTime);



        try {
            const oeeQuery = query(collection(db, "oee"), where("machine", "==", machine));
            const querySnapshot = await getDocs(oeeQuery);

            if (querySnapshot.empty) {
                console.log(`No OEE document found for machine: ${machine}`);
                toast.error(`No OEE data found for machine: ${machine}`);
                return;
            }

            querySnapshot.forEach(async (docSnapshot) => {
                const oeeDocRef = docSnapshot.ref;
                const olddowntimeData = docSnapshot.data().downtime;
                await updateDoc(oeeDocRef, {
                    downtime: olddowntimeData + timeDifference,
                });
            });

            console.log(querySnapshot);

            toast.success(`machine: '${machine}' downtime updated successfully!`, {
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

                <h1 className="text-2xl font-bold mb-6">Add Downtime</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="machine" className="text-lg font-semibold">Choose a machine</Label>
                        <Select onValueChange={setMachine} required>
                            <SelectTrigger id="machine" className="w-full mt-1">
                                <SelectValue placeholder="Select Machine" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Injection1">Injection Molding 1</SelectItem>
                                <SelectItem value="Injection2">Injection Molding 2</SelectItem>
                                <SelectItem value="Injection3">Injection Molding 3</SelectItem>
                                <SelectItem value="extrusion">Extrusion Machine</SelectItem>
                                <SelectItem value="spring">Spring Machine</SelectItem>
                                <SelectItem value="subassembly">Subassembly Machine</SelectItem>
                                <SelectItem value="finalassembly">Final Assembly Machine</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-lg font-semibold">Start Time</Label>
                            <DateTimePicker dateTime={startTime} setDateTime={setStartTime} />
                        </div>

                        <div>
                            <Label className="text-lg font-semibold">End Time</Label>
                            <DateTimePicker dateTime={endTime} setDateTime={setEndTime} />
                        </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg">
                        Add Downtime
                    </Button>
                </form>
            </div>
        </div>
    );
}
