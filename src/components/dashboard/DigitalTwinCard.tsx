import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';



interface StudentAttribute {

name: string;

value: number;

}



interface DigitalTwinStudent {

studentId: string;

firstName: string;

lastName: string;

form: string | number;

overall: number;

potentialOverall?: number;

attributes: StudentAttribute[];

plans?: any[];

activePlan?: string;

}



interface DigitalTwinCardProps {

students: DigitalTwinStudent[];

loading: boolean;

}



const DigitalTwinCard: React.FC<DigitalTwinCardProps> = ({ students, loading }) => {

const [currentIndex, setIndex] = useState(0);

const navigate = useNavigate();



useEffect(() => {

if (students.length > 1) {

const timer = setInterval(() => setIndex(prev => (prev + 1) % students.length), 7000);

return () => clearInterval(timer);

}

}, [students]);



if (loading) return (

<div className="bg-gray-50 p-3 rounded-lg h-full flex items-center justify-center">

<p className="text-xs text-gray-400 animate-pulse">Loading development data...</p>

</div>

);



if (students.length === 0) return (

<div className="bg-gray-50 p-3 rounded-lg h-full text-center flex items-center justify-center text-[11px] text-gray-500">

No students found for this course

</div>

);



const student = students[currentIndex];

const studentScore = student.overall || 0;

const potentialScore = student.potentialOverall || 90;


let safeStudentScore = studentScore;

if (studentScore > potentialScore) {

safeStudentScore = studentScore - 10;

}

const progressPercentage = potentialScore > 0

? Math.min((safeStudentScore / potentialScore) * 100, 100)

: 0;



return (

<div

className="bg-gray-50 p-2 rounded-lg shadow h-full cursor-pointer hover:bg-gray-100 transition-colors flex flex-col overflow-hidden"

onClick={() => navigate(`/development/${student.studentId}`)}

>

<h2 className="text-lg font-black mb-1 uppercase tracking-tighter text-gray-700 text-center">STUDENT DEVELOPMENT</h2>


<AnimatePresence mode="wait">

<motion.div

key={student.studentId}

initial={{ opacity: 0, y: 10 }}

animate={{ opacity: 1, y: 0 }}

exit={{ opacity: 0, y: -10 }}

transition={{ duration: 0.4 }}

className="flex flex-col flex-1 min-h-0"

>

{/* Header Section: Increased MB from 1.5 to 3 to create the profile-progress gap */}

<div className="flex items-start mb-3">

<div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shrink-0">

<svg viewBox="0 0 24 24" width="40" height="40" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">

<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>

<circle cx="12" cy="7" r="4"></circle>

</svg>

</div>


<div className="ml-5">

<h3 className="text-lg font-semibold leading-tight">{student.lastName}</h3>

<p className="text-sm text-gray-500 uppercase font-bold tracking-tight">{student.firstName}</p>

<div className="flex mt-0.5 items-end">

<span className="text-3xl font-black mr-1 tracking-tighter leading-none">{studentScore}</span>

<span className="text-[16px] font-bold text-gray-400 leading-none">OVR</span>

</div>

</div>



<div className="ml-auto text-right">

<p className="text-[10px] mb-0 text-gray-500 font-bold uppercase tracking-tight">Form {student.form}</p>

               <p className="text-[10px] text-blue-500 font-black uppercase tr    acking-tighter mt-2">
           
                   {student.plans?.length || 0} Plans Available</p>                 
                   <p className="text-[10px] text-emerald-500 font-black uppercase     tracking-tighter">               
                 Active Plan : {student.activePlan || 'None'}       
                 </p>

</div>

</div>



{/* Progress Section: Reduced MB from 2 to 1 to bring the grid closer */}

<div className="mb-2 mt-1">

<div className="flex justify-between text-[12px] font-bold mb-0.5 text-gray-400">

<span>Current: {studentScore}%</span>

<span>Potential: {potentialScore}%</span>

</div>

<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">

<motion.div

initial={{ width: 0 }}

animate={{ width: `${progressPercentage}%` }}

transition={{ duration: 0.8, ease: "easeOut" }}

className="bg-green-500 h-1 rounded-full"

/>

</div>

</div>



{/* Attributes Flex Row: Distributes 5 items evenly */}

<div className="flex justify-between items-center text-center mt-1 pb-1 w-full">

{/* Inside DigitalTwinCard.tsx - Attributes map */}
{student.attributes?.slice(0, 7).map((attr, index) => (
  <div key={index} className="flex flex-col items-center flex-1 min-w-0 px-0.5">
    <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-tighter w-full" title={attr.name}>
      {attr.name}
    </p>
    
    <p className={`text-xs font-black leading-none mt-0.5 ${
      attr.value > 75 ? 'text-emerald-500' : 
      attr.value > 40 ? 'text-blue-500' : 'text-rose-500'
    }`}>
      {attr.value}%
    </p>
  </div>
))}

</div>

</motion.div>

</AnimatePresence>

</div>

);

};



export default DigitalTwinCard;






