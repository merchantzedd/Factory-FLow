import React, { useState } from 'react';
import { AttendanceEntry, ProcessStage } from '../types';
import { STAGES_ORDERED } from '../constants';
import { Users, Save, CalendarDays, HardHat } from 'lucide-react';

interface AttendancePanelProps {
  attendanceRecords: AttendanceEntry[];
  onUpdateAttendance: (entry: AttendanceEntry) => void;
}

const AttendancePanel: React.FC<AttendancePanelProps> = ({ attendanceRecords, onUpdateAttendance }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLine, setSelectedLine] = useState('Line 1');

  const lines = ['Line 1', 'Line 2', 'Line 3'];

  // Helper to find existing record or return empty template
  const getRecord = (stage: ProcessStage) => {
    return attendanceRecords.find(
      r => r.date === selectedDate && r.line === selectedLine && r.stage === stage
    ) || {
      id: '',
      date: selectedDate,
      line: selectedLine,
      stage: stage,
      operators: 0,
      helpers: 0,
      manpower: 0
    };
  };

  const handleChange = (stage: ProcessStage, field: keyof AttendanceEntry, value: string) => {
    const existing = getRecord(stage);
    const updated: AttendanceEntry = {
      ...existing,
      id: existing.id || `${selectedDate}-${selectedLine}-${stage}`,
      [field]: Number(value)
    };
    onUpdateAttendance(updated);
  };

  const calculateTotalStaff = () => {
    return attendanceRecords
      .filter(r => r.date === selectedDate && r.line === selectedLine)
      .reduce((sum, r) => sum + r.operators + r.helpers + r.manpower, 0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-indigo-600" />
              Daily Manpower & Attendance
            </h2>
            <p className="text-slate-500 text-sm">Track operators, helpers, and general manpower per line.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 px-3">
              <CalendarDays size={18} className="text-slate-500" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
              />
            </div>
            <div className="h-6 w-px bg-slate-300"></div>
            <select 
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-slate-700 font-bold cursor-pointer hover:text-indigo-600"
            >
              {lines.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-center gap-4">
             <div className="p-3 bg-indigo-200 rounded-full text-indigo-700">
               <Users size={24} />
             </div>
             <div>
               <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total Staff</p>
               <p className="text-2xl font-bold text-indigo-900">{calculateTotalStaff()}</p>
             </div>
          </div>
           {/* Add more summary cards if needed */}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4 w-1/4">Process Stage</th>
                <th className="p-4 w-1/5 text-center">Machine Operators</th>
                <th className="p-4 w-1/5 text-center">Helpers</th>
                <th className="p-4 w-1/5 text-center">Manpower</th>
                <th className="p-4 w-1/5 text-right">Total Line Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {STAGES_ORDERED.map((stage) => {
                const record = getRecord(stage);
                const rowTotal = record.operators + record.helpers + record.manpower;
                
                return (
                  <tr key={stage} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                       {stage}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="0"
                          className="w-20 text-center border border-slate-200 rounded-md py-1.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                          value={record.operators || ''}
                          placeholder="0"
                          onChange={(e) => handleChange(stage, 'operators', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="0"
                          className="w-20 text-center border border-slate-200 rounded-md py-1.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                          value={record.helpers || ''}
                          placeholder="0"
                          onChange={(e) => handleChange(stage, 'helpers', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="0"
                          className="w-20 text-center border border-slate-200 rounded-md py-1.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                          value={record.manpower || ''}
                          placeholder="0"
                          onChange={(e) => handleChange(stage, 'manpower', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">
                      {rowTotal > 0 ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          {rowTotal} Staff
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex justify-end">
           <div className="flex items-center gap-2 text-sm text-slate-500">
             <Save size={16} />
             <span>Data is saved automatically as you type.</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePanel;
