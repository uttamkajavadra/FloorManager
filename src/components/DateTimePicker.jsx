// src/components/DateTimePicker.js
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker as MUIDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb'; // Import this for 24-hour format

const DateTimePicker = ({ dateTime, setDateTime }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MUIDateTimePicker
                value={dateTime}
                onChange={(newValue) => setDateTime(newValue)}
                renderInput={(params) => (
                    <TextField {...params} required />
                )}
                format="DD/MM/YYYYHH:mm"
                ampm={false} 
            />
        </LocalizationProvider>
    );
};

export default DateTimePicker;
