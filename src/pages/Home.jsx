// src/pages/Home.jsx


import { useState, useEffect } from "react";
import { getPublicStats } from "../services/api";





export default function Home({navigate}) {
  const [stats, setStats] = useState(null);

useEffect(() => {
  getPublicStats()
    .then((data) => setStats(data))
    .catch(() => setStats(null));
}, []);
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Home Page Content Wrapper */}
      <section className="space-y-10">
        
        {/* 1. Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-12 shadow-lg">
          <div className="max-w-3xl space-y-5">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-indigo-200">
              <i className="fa-solid fa-laptop-code"></i> Excellence in Technology Education Since 1999
            </div>
            
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              College Registration & Academic Management System
            </h1>
            
            {/* Description */}
            <p className="text-indigo-100 text-base sm:text-lg leading-relaxed">
              Manage academic programs, student course registrations, grade reports, and administrative workflows in a unified Single-Page Application interface.
            </p>
            
            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button onClick={() => navigate('dashboard')} className="px-5 py-2.5 rounded-xl bg-indigo text-white font-semibold text-sm hover:bg-indigo-500 transition shadow ">
                <i className="fa-solid fa-table-columns mr-2"></i>Open Student Registrar Sandbox
                
              </button>
              <button onClick={() => navigate('services')} className="px-5 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-400/30 font-semibold text-sm transition">
                Explore Academic Programs
              </button>
              <button onClick={() => navigate('auth-preview')} className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-600 text-sm font-medium transition">
                <i className="fa-solid fa-lock mr-1.5"></i>Inspect Login UI & Defenses
              </button>
            </div>

          </div>
        </div>
        


        {/* 2. Institutional Metrics Bar */}
        <div className="space-y-8">
      {/* Your existing Hero / Welcome banner stays right here */}

      {/* Live Institutional Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Degree Programs
          </div>
          <div className="text-3xl font-extrabold text-indigo-700 mt-1">
            {stats ? stats.totalPrograms : "—"}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Active Courses
          </div>
          <div className="text-3xl font-extrabold text-indigo-700 mt-1">
            {stats ? stats.totalCourses : "—"}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Total Enrollments
          </div>
          <div className="text-3xl font-extrabold text-indigo-700 mt-1">
            {stats ? stats.totalEnrollments : "—"}
          </div>
        </div>
      </div>

     
    </div>
{/* 3. Quick Portal Modules & Academic Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SIDE: Modules (Takes up 2 of the 3 columns on large screens) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registrar Portal Modules</h2>
                <p className="text-xs text-slate-500">Core student and academic administration workflows</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Active View: Demo Student
              </span>
            </div>

            {/* Nested Grid for the 4 Module Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              <button className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-book-open"></i>
                  </span>
                  <i className="fa-solid fa-arrow-right text-slate-400 group-hover:text-indigo-600 transition"></i>
                </div>
                <div className="font-semibold text-slate-900 text-sm">Course Registration</div>
                <p className="text-xs text-slate-500 mt-1">Enroll in semester courses, verify prerequisites, and track credit-hour limits.</p>
              </button>

              <button className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-left transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-chart-line"></i>
                  </span>
                  <i className="fa-solid fa-arrow-right text-slate-400 group-hover:text-emerald-600 transition"></i>
                </div>
                <div className="font-semibold text-slate-900 text-sm">Grade Report & CGPA</div>
                <p className="text-xs text-slate-500 mt-1">Inspect term grades, calculate cumulative GPA, and model future academic standing.</p>
              </button>
               
              <button className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 text-left transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-microchip"></i>
                  </span>
                  <i className="fa-solid fa-arrow-right text-slate-400 group-hover:text-amber-600 transition"></i>
                </div>
                <div className="font-semibold text-slate-900 text-sm">Academic Program & Research</div>
                <p className="text-xs text-slate-500 mt-1">Inspect term grades, calculate cumulative GPA, and model future academic standing.</p>
              </button>
                

               <button className="p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 text-left transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-user-shield"></i>
                  </span>
                  <i className="fa-solid fa-arrow-right text-slate-400 group-hover:text-purple-600 transition"></i>
                </div>
                <div className="font-semibold text-slate-900 text-sm">Portal User Login & Anti-Phishing</div>
                <p className="text-xs text-slate-500 mt-1">Inspect term grades, calculate cumulative GPA, and model future academic standing.</p>
              </button>
 

            </div>
          </div>

          {/* RIGHT SIDE: Academic Calendar (Takes up 1 column) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                <i className="fa-regular fa-calendar-check text-indigo-600 mr-2"></i>Academic Calendar
              </h2>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Term Active</span>
            </div>
            
            <ul className="space-y-3 text-xs">
              <li className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-800">Regular Registration</div>
                  <div className="text-slate-500">Online portal window open</div>
                </div>
                <span className="font-medium text-indigo-700">Week 1</span>
              </li>
              <li className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-800">Add / Drop Deadline</div>
                  <div className="text-slate-500">Advisor approval required</div>
                </div>
                <span className="font-medium text-indigo-700">Week 3</span>
              </li>
               
               <li className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-800">Mid-Term Assesment Period</div>
                  <div className="text-slate-500">All CS & SE Students</div>
                </div>
                <span className="font-medium text-indigo-700">Week 8</span>
              </li>
         
               <li className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-800">Final Exam and Grading</div>
                  <div className="text-slate-500">Grade Publication On Portal</div>
                </div>
                <span className="font-medium text-indigo-700">Week 16</span>
              </li>
               

            </ul>
          </div>

        </div>
      </section>

    
    </main>
  );
}