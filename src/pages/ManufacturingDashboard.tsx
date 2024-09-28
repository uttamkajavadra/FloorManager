import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"
// import Link from 'next/link'
import { db } from '../db/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import Cookies from 'js-cookie';

interface Machine {
    id: string;
    machine: string;
    currentProduct: string;
    batchNumber: number;
    startTime: string;
    endTime: string;
    produced: number;
    addedToStock: number;
}

interface Oee {
    id: string;
    machine: string;
    status: string;
    planned_production_time: number;
    downtime: number;
    ideal_cycle_time: number;
    total_produced: number;
    added_product: number;
    current_product: string;
}

interface Comments {
    id: string;
    activityMessage: string;
    currentTime: string;
}

interface Machine2 {
    id: string;
    name: string;
    availability: number;
    performance: number;
    quality: number;
    oee: number;
    status: string;
    currentProduct: string;
    produced: number;
    added: number;
}

interface TargetData {
    target: number;
    produced: number;
    waste: number;
}

interface User {
    id: string;
    email: string;
    type: string;
}

let machines: Machine2[] = [];

export default function ManufacturingDashboard() {

    const [data, setData] = useState<Machine[]>([]);
    const [comments, setComments] = useState<Comments[]>([]);
    const [oeeData, setOeeData] = useState<Oee[]>([]);
    const [user, setUser] = useState<User | null>(null);

    const [target, setTarget] = useState<{ id: number; target: number; produced: number; waste: number }[]>([]);
    let totalTargetProducedMonth = 0;
    let totalTargetProducedDay = 0;
    let totalTargetProducedShift = 0;
    let wasteTotalMonth = 0;
    let wasteTotalDay = 0;
    let wasteTotalDayShift = 0;

    useEffect(() => {
        const userCookie = Cookies.get('user');
        if (userCookie) {
            setUser(JSON.parse(userCookie) as User);
        }

        console.log("User : ", user);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch machines
            const machinesQuery = query(collection(db, "machines"));
            const querySnapshot = await getDocs(machinesQuery);

            const machinesData: Machine[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Machine[];

            setData(machinesData);

            // Reset totals
            totalTargetProducedMonth = 0;
            totalTargetProducedDay = 0;
            totalTargetProducedShift = 0;
            wasteTotalMonth = 0;
            wasteTotalDay = 0;
            wasteTotalDayShift = 0;



            // Get the current date and time
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentDay = currentDate.getDate();
            const currentYear = currentDate.getFullYear();
            const currentTime = currentDate.getTime();

            // Calculate the start time of the last 8 hours
            const eightHoursAgoTime = currentTime - (8 * 60 * 60 * 1000);
            const dailyHourseAgoTime = currentTime - (24 * 60 * 60 * 1000);

            machinesData.forEach((machine) => {
                const startTime = machine.startTime;
                const endTime = machine.endTime;
                const [startDay, startMonth, startYear, startHours, startMinutes] = [
                    startTime.slice(0, 2),
                    startTime.slice(3, 5),
                    startTime.slice(6, 10),
                    startTime.slice(11, 13),
                    startTime.slice(14, 16)
                ];
                const [endDay, endMonth, endYear, endHours, endMinutes] = [
                    endTime.slice(0, 2),
                    endTime.slice(3, 5),
                    endTime.slice(6, 10),
                    endTime.slice(11, 13),
                    endTime.slice(14, 16)
                ];

                const machineStartDate = new Date(`${startYear}-${startMonth}-${startDay}T${startHours}:${startMinutes}:00`);
                const machineEndDate = new Date(`${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:00`);

                const machineStartTime = machineStartDate.getTime();
                const machineEndTime = machineEndDate.getTime();

                const dateMonth = machineStartDate.getMonth() + 1;
                const dateDay = machineStartDate.getDate();
                const dateYear = machineStartDate.getFullYear();

                // Monthly calculation
                if (dateMonth === currentMonth && dateYear === currentYear) {
                    totalTargetProducedMonth += machine.produced;
                    wasteTotalMonth += (machine.produced - machine.addedToStock);
                }

                // Daily calculation
                if (machineStartTime <= currentTime && machineEndTime >= dailyHourseAgoTime) {
                    totalTargetProducedDay += machine.produced;
                    wasteTotalDay += (machine.produced - machine.addedToStock);
                }

                // Shift calculation (last 8 hours)
                if (machineStartTime <= currentTime && machineEndTime >= eightHoursAgoTime) {
                    totalTargetProducedShift += machine.produced;
                    wasteTotalDayShift += (machine.produced - machine.addedToStock);
                }
            });

            console.log("Total Produced Month: ", totalTargetProducedMonth);
            console.log("Total Produced Day: ", totalTargetProducedDay);
            console.log("Total Produced in last 8 hours (Shift): ", totalTargetProducedShift);

            // Fetch targets
            const oeeQuery = query(collection(db, "target"));
            const targetSnapshot = await getDocs(oeeQuery);
            const targetData = targetSnapshot.docs.map(doc => doc.data());

            // Set the target data based on the fetched data and calculated produced values
            setTarget([
                { id: 1, target: targetData[0].monthly, produced: totalTargetProducedMonth, waste: wasteTotalMonth },
                { id: 2, target: targetData[0].daily, produced: totalTargetProducedDay, waste: wasteTotalDay },
                { id: 3, target: targetData[0].shift, produced: totalTargetProducedShift, waste: wasteTotalDayShift },
            ]);
        };

        fetchData();
    }, []);


    useEffect(() => {
        const fetchOee = () => {
            const oeeQuery = query(collection(db, "oee"));

            getDocs(oeeQuery)
                .then((querySnapshot) => {
                    const oeeData: Oee[] = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Oee[];

                    setOeeData(oeeData);

                    console.log("Oee Data: ", oeeData);
                    machines = [];

                    oeeData.map((oee) => {
                        if (oee.planned_production_time != 0) {
                            const avaiilibility = (oee.planned_production_time - oee.downtime) / oee.planned_production_time;
                            const performance = (oee.ideal_cycle_time * oee.total_produced) / ((oee.planned_production_time - oee.downtime) * 60);
                            const quality = (oee.added_product / oee.total_produced);
                            const OEE = avaiilibility * performance * quality;
                            console.log(oee.planned_production_time, oee.downtime);
                            machines.push({ id: oee.id, name: oee.name, availability: parseFloat((avaiilibility * 100).toFixed(2)), performance: parseFloat((performance * 100).toFixed(2)), quality: parseFloat((quality * 100).toFixed(2)), oee: parseFloat((OEE * 100).toFixed(2)), status: oee.status, currentProduct: oee.current_product, produced: oee.total_produced, added: oee.added_product });

                        }
                    });

                    console.log("updated : ", machines);
                });
        };

        fetchOee();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const commentQuery = query(
                collection(db, "comments")
                // Order by startTime in descending order
            );

            const querySnapshot = await getDocs(commentQuery);
            const commentsData: Comments[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Comments[];

            setComments(commentsData);
            console.log("Fetched Machines Data:", commentsData);
        };

        fetchData();


    }, []);



    const navigate = useNavigate();

    const [productionTargets, setProductionTargets] = useState<{
        monthly: TargetData;
        daily: TargetData;
        shift: TargetData;
    }>({
        monthly: { target: 0, produced: 0, waste: 0 },
        daily: { target: 0, produced: 0, waste: 0 },
        shift: { target: 0, produced: 0, waste: 0 }
    });

    useEffect(() => {
        const fetchTargets = async () => {
            const querySnapshot = await getDocs(collection(db, 'target'));
            const targets: Record<string, TargetData> = {}; // Explicitly typed object

            querySnapshot.forEach((doc) => {
                // Ensure the document data matches the TargetData structure
                targets[doc.id] = doc.data() as TargetData;
            });

            // Merge with the default structure
            setProductionTargets(prevTargets => ({
                ...prevTargets,
                ...targets
            }));
        };

        fetchTargets();
    }, []);


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational':
                return 'text-green-500'
            case 'maintenance':
                return 'text-yellow-500'
            case 'down':
                return 'text-red-500'
            default:
                return 'text-gray-500'
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto space-y-4">
                <h1 className="text-2xl font-bold text-center sm:text-left">Manufacturing Dashboard</h1>

                <Card className=''>
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <CardTitle>OEE Dashboard</CardTitle>
                                <CardDescription>Overall Equipment Effectiveness for each machine</CardDescription>
                            </div>

                            <div>
                                {user && (<>
                                    <Button size="sm" className="ml-auto hover:shadow-xl transition-shadow duration-300" onClick={() => navigate('/status-update')}>Update Status</Button>
                                    <Button size="sm" className="ml-auto hover:shadow-xl transition-shadow duration-300 ml-3" onClick={() => navigate('/downtime-update')}>Add Downtime</Button>
                                </>)}

                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className=' flex-wrap overflow-x-auto'>
                        <div className="overflow-x-auto pb-4 md:overflow-x-visible">
                            <div className="flex flex-nowrap gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                                {machines.map((machine) => (
                                    <Card key={machine.id} className="min-w-[280px] md:min-w-0">
                                        <CardHeader>
                                            <CardTitle className='text-2xl'>{machine.name}</CardTitle>
                                            <CardDescription className={getStatusColor(machine.status)}>
                                                Status: {machine.status}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Availability</span>
                                                    <span>{machine.availability}%</span>
                                                </div>
                                                <Progress value={machine.availability} className="h-2" />
                                                <div className="flex justify-between text-sm">
                                                    <span>Performance</span>
                                                    <span>{machine.performance}%</span>
                                                </div>
                                                <Progress value={machine.performance} className="h-2" />
                                                <div className="flex justify-between text-sm">
                                                    <span>Quality</span>
                                                    <span>{machine.quality}%</span>
                                                </div>
                                                <Progress value={machine.quality} className="h-2" />
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span>OEE</span>
                                                    <span>{machine.oee}%</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-start">
                            <div>
                                <CardTitle>Machine Production</CardTitle>
                                <CardDescription>Current production details for each machine</CardDescription>
                            </div>

                            {user && (<>
                                <Button size="sm" className="ml-auto hover:shadow-xl transition-shadow duration-300" onClick={() => navigate('/add-current-prouct')}>Add Current Product</Button>
                            </>)}
                        </div>

                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className='font-black'>
                                        <TableHead className="font-black" >Machine</TableHead>
                                        <TableHead className="font-black" >Current Product</TableHead>
                                        <TableHead className="font-black" >Batch Number</TableHead>
                                        <TableHead className="font-black" >Start Time</TableHead>
                                        <TableHead className="font-black" >End Time</TableHead>
                                        <TableHead className="font-black" >Produced</TableHead>
                                        <TableHead className="font-black" >Added to Stock</TableHead>
                                        <TableHead className="font-black" >Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((datas) => (
                                        <TableRow key={datas.id}>
                                            <TableCell>{datas.machine}</TableCell>
                                            <TableCell>{datas.currentProduct}</TableCell>
                                            <TableCell>{datas.batchNumber}</TableCell>
                                            <TableCell>{datas.startTime}</TableCell>
                                            <TableCell>{datas.endTime}</TableCell>
                                            <TableCell>{datas.produced}</TableCell>
                                            <TableCell>{datas.addedToStock}</TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">View</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-[800px] w-full">
                                                        <DialogHeader>
                                                            <DialogTitle>{datas.machine} - Production Details</DialogTitle>
                                                            <DialogDescription>Detailed information about the current production run</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <h3 className="font-semibold">Current Product</h3>
                                                                <p>{datas.currentProduct}</p>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">Batch Number</h3>
                                                                <p>{datas.batchNumber}</p>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">Start Time</h3>
                                                                <p>{datas.startTime}</p>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">End Time</h3>
                                                                <p>{datas.endTime}</p>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">Produced</h3>
                                                                <p>{datas.produced}</p>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">Added to Stock</h3>
                                                                <p>{datas.addedToStock}</p>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">Waste</h3>
                                                                <p>{datas.produced - datas.addedToStock} </p>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">Efficiency</h3>
                                                                <p>{(datas.addedToStock / datas.produced * 100).toFixed(2)}%</p>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start">
                                <div>
                                    <CardTitle>Priorities for Next 24 Hours</CardTitle>
                                    <CardDescription>Key tasks and maintenance activities</CardDescription>
                                </div>

                                {user && (<>
                                    <Button size="sm" className="ml-auto hover:shadow-xl transition-shadow duration-300" onClick={() => navigate('/add-comment')}>Add Comment</Button>
                                </>)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 pt-2">
                                {comments.map((comment) => (
                                    <li key={comment.id} className="flex items-center justify-between">
                                        <span className="">{comment.activityMessage}</span>
                                        <span className="text-sm text-gray-500">{comment.currentTime}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-start">
                                <div>
                                    <CardTitle>Production Targets</CardTitle>
                                    <CardDescription>Monthly, daily, and shift targets vs. actual production</CardDescription>
                                </div>

                                {user && user.type == "manager" && (<>
                                    <Button size="sm" className="ml-auto hover:shadow-xl transition-shadow duration-300" onClick={() => navigate('/add-target')}>Add Target</Button>
                                </>)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="1">
                                <TabsList>
                                    <TabsTrigger value="1">Monthly</TabsTrigger>
                                    <TabsTrigger value="2">Daily</TabsTrigger>
                                    <TabsTrigger value="3">Shift</TabsTrigger>
                                </TabsList>
                                {target.map((data) => (
                                    <TabsContent key={data.id} value={String(data.id)}>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Target</span>
                                                <span>{data.target}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Produced</span>
                                                <span>{data.produced}</span>
                                            </div>
                                            <Progress value={(data.produced / data.target) * 100} className="h-2" />
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Waste</span>
                                                <span>{data.waste}</span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span>Efficiency</span>
                                                <span>  {data.target === 0
                                                    ? "100"  
                                                    : `${((data.produced - data.waste) / data.target * 100).toFixed(2)}` // Otherwise, calculate the percentage
                                                }%</span>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Machine Status Overview</CardTitle>
                        <CardDescription>Current status and performance of all machines</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Outer container for horizontal scroll on smaller devices */}
                        <div className="overflow-x-auto pb-4">
                            {/* Flex container for horizontal scroll on smaller devices, grid for larger devices */}
                            <div className="flex flex-nowrap gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                                {machines.map((machine) => (
                                    <Card key={machine.id} className="min-w-[280px] md:min-w-0">
                                        <CardHeader>
                                            <CardTitle>{machine.name}</CardTitle>
                                            <CardDescription className={getStatusColor(machine.status)}>
                                                {machine.status === 'operational' ? (
                                                    <CheckCircle className="inline-block mr-2" />
                                                ) : machine.status === 'maintenance' ? (
                                                    <Clock className="inline-block mr-2" />
                                                ) : (
                                                    <AlertTriangle className="inline-block mr-2" />
                                                )}
                                                {machine.status}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>OEE</span>
                                                    <span>{machine.oee}%</span>
                                                </div>
                                                <Progress value={machine.oee} className="h-2" />
                                                <div className="flex justify-between text-sm">
                                                    <span>Current Product</span>
                                                    <span>{machine.currentProduct}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>

                </Card>
            </div>
        </div>
    )
}