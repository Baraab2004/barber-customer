import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
  month: "space-y-4",
  caption: "flex justify-center pt-1 relative items-center",
  caption_label: "text-sm font-medium text-[#1e3a5f]",
  nav: "space-x-1 flex items-center",
  nav_button:
    "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-[#eef4fb] text-[#1e3a5f]",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse space-y-1",
  head_row: "flex",
  head_cell:
    "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "h-9 w-9 text-center text-sm p-0 relative",
  day: "h-9 w-9 p-0 font-normal rounded-full text-slate-800 hover:bg-[#eef4fb] hover:text-[#1e3a5f] aria-selected:opacity-100",
  day_selected:
    "bg-[#1e3a5f] text-white hover:bg-[#16324f] hover:text-white focus:bg-[#16324f] focus:text-white rounded-full",
day_today: "text-[#1e3a5f]",  day_range_start: "bg-transparent",
  day_range_end: "bg-transparent",
  day_range_middle: "bg-transparent text-inherit",
  day_outside: "text-slate-300 opacity-50",
  day_disabled: "text-slate-300 opacity-50",
  day_hidden: "invisible",
}}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
