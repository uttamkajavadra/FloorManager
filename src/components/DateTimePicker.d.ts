import { Dayjs } from 'dayjs';
import { FC } from 'react';

interface DateTimePickerProps {
    dateTime: Dayjs | null;
    setDateTime: React.Dispatch<React.SetStateAction<Dayjs | null>>;
}

declare const DateTimePicker: FC<DateTimePickerProps>;

export default DateTimePicker;