import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // You might not need this anymore
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import DateTimePicker from '../components/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { db } from '../db/firebase';
import { collection, addDoc, query, getDocs, updateDoc, where } from 'firebase/firestore';


export default function AddMachine() {
    const [machine, setMachine] = useState("");
    const [currentProduct, setCurrentProduct] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [produced, setProduced] = useState("");
    const [addedToStock, setAddedToStock] = useState("");
    // const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const calculateTimeDifference = (start: string, end: string): number => {
        const startTime = dayjs(start, 'DD/MM/YYYY HH:mm');
        const endTime = dayjs(end, 'DD/MM/YYYY HH:mm');

        return endTime.diff(startTime, 'minute');
    };

    // const isValidProduct = (value: string) => /^[a-zA-Z\s]*$/.test(value);
    // const isNumeric = (value: string) => /^\d+$/.test(value);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        const formattedStartTime = startTime ? dayjs(startTime).format('DD/MM/YYYY HH:mm') : '';
        const formattedEndTime = endTime ? dayjs(endTime).format('DD/MM/YYYY HH:mm') : '';
        const timeDifference = calculateTimeDifference(formattedStartTime, formattedEndTime);


        if (endTime && startTime && endTime.isBefore(startTime)) {
            toast.error('End time must be after start time!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return; 
        }

        

        try {
            await addDoc(collection(db, "machines"), {
                machine,
                currentProduct,
                batchNumber: parseInt(batchNumber),
                startTime: formattedStartTime,
                endTime: formattedEndTime,
                produced: parseInt(produced),
                addedToStock: parseInt(addedToStock),
            });
            console.log(machine);
    
            const oeeQuery = query(collection(db, "oee"), where("machine", "==", machine));
            const querySnapshot = await getDocs(oeeQuery);
            console.log(oeeQuery, querySnapshot);
    
            if (querySnapshot.empty) {
                console.log(`No OEE document found for machine: ${machine}`);
                toast.error(`No OEE data found for machine: ${machine}`);
                return;
            }
    
            querySnapshot.forEach(async (docSnapshot) => {
                const oeeDocRef = docSnapshot.ref;
                const oldProdect = docSnapshot.data().added_product;
                const oldProduced = docSnapshot.data().total_produced;
                const oldPlannedProductionTime = docSnapshot.data().planned_production_time;
                await updateDoc(oeeDocRef, {
                    added_product: parseInt(oldProdect) + parseInt(addedToStock),  
                    total_produced: parseInt(oldProduced) +  parseInt(produced),
                    planned_production_time: parseInt(oldPlannedProductionTime) + timeDifference,
                    current_product: currentProduct,        
                });
    
                // Log success
                console.log(`OEE data for machine '${machine}' updated successfully!`);
                navigate('/dashboard');
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
    
    // const timeDifference = (start: Dayjs | null, end: Dayjs | null): number => {
    //     if (!start || !end) return 0;
    //     return end.diff(start, 'minute'); 
    // };


    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                <h1 className="text-2xl font-bold mb-6">Add Current Product</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="machine" className="text-lg font-semibold">Choose a machine</Label>
                        <Select onValueChange={setMachine} required>
                            <SelectTrigger id="machine" className="w-full mt-1">
                                <SelectValue placeholder="Choose a machine type" />
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

                    <div>
                        <Label htmlFor="currentProduct" className="text-lg font-semibold">Current Product</Label>
                        <Input
                            id="currentProduct"
                            type="text"
                            placeholder="Enter current product"
                            value={currentProduct}
                            onChange={(e) => setCurrentProduct(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="batchNumber" className="text-lg font-semibold">Batch Number</Label>
                        <Input
                            id="batchNumber"
                            type="text"
                            placeholder="Enter batch number"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                            required
                        />
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

                    <div>
                        <Label htmlFor="produced" className="text-lg font-semibold">Produced</Label>
                        <Input
                            id="produced"
                            type="number"
                            placeholder="Enter number of items produced"
                            value={produced}
                            onChange={(e) => setProduced(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="addedToStock" className="text-lg font-semibold">Added to Stock</Label>
                        <Input
                            id="addedToStock"
                            type="number"
                            placeholder="Enter number of items added to stock"
                            value={addedToStock}
                            onChange={(e) => setAddedToStock(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg">
                        Add Current Product
                    </Button>

                </form>
            </div>
        </div>
    );
}
