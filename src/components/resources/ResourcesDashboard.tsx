import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Folder, 
    Search as SearchIcon, 
    BarChart, 
    Star, 
    UploadCloud, 
    Link as LinkIcon 
} from 'lucide-react';
import Sidebar from './Sidebar';
import UploadModal from './UploadModal';
import ResourcesView from './ResourcesView';
import CourseCard from './CourseCard'; 
import StatCard from './StatCard';     
import { AIAssessmentModal } from '../assessments/AIAssessmentModal';

// ── Service Imports ──────────────────────────────────────────────────────────
import { resourceService, courseService } from '../../services/api';


// --- Type Definitions ---
export interface Course {
    _id: string;
    name: string;
    code?: string;
    resourceCount: number;
    lastUpdated: string;
    documents: number;
    images: number;
    videos: number;
    others: number;
}

export interface RecentUpload {
    _id: string; 
    name: string; 
    type: string; 
    createdAt: string;
    course: { _id: string; name: string; code?: string; };
    uploadedBy: { _id: string; firstName: string; lastName: string; };
}

export interface Analytics {
    totalResources: number;
    averageDownloads: number;
    mostPopularResource: string;
    topClassEngagement: string;
}

const ResourcesDashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // --- State Management ---
    const [courses, setCourses] = useState<Course[]>([]);
    const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
    const [selectedClass, setSelectedClass] = useState<Course | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<Analytics>({ 
        totalResources: 0, 
        averageDownloads: 0, 
        mostPopularResource: 'N/A', 
        topClassEngagement: 'N/A' 
    });

    // Modals State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedCourseForUpload, setSelectedCourseForUpload] = useState<Course | null>(null);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [selectedCourseIdForAssessment, setSelectedCourseIdForAssessment] = useState<string | null>(null);

    // ── Fetching Logic using resourceService ────────────────────────────────────
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Execute all service calls in parallel
            const [teachingCourses, countsData, recentRes] = await Promise.all([
                courseService.getTeachingCourses(),
                resourceService.getResourceCounts(),
                resourceService.getRecentUploads(5)
            ]);
            
            // Map course data with their specific resource counts from the aggregation
            const updatedCourses = teachingCourses.map((course: any) => {
                const stats = countsData[course._id] || {};
                return {
                    ...course,
                    resourceCount: stats.count || 0,
                    lastUpdated: stats.lastUpdated || '',
                    documents: stats.documents || 0,
                    images: stats.images || 0,
                    videos: stats.videos || 0,
                    others: stats.others || 0,
                };
            });
            
            setCourses(updatedCourses);
            setRecentUploads(recentRes);
        } catch (error) { 
            console.error('Error fetching dashboard data:', error);
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // ── Analytics Memo ──────────────────────────────────────────────────────────
    useMemo(() => {
        if (courses.length === 0) return;
        const totalResources = courses.reduce((sum, course) => sum + course.resourceCount, 0);
        const topClass = courses.reduce((prev, current) => (prev.resourceCount > current.resourceCount) ? prev : current, courses[0]);
        
        setAnalytics({
            totalResources: totalResources,
            averageDownloads: 0,
            mostPopularResource: 'N/A',
            topClassEngagement: topClass?.name || 'N/A',
        });
    }, [courses]);

    // --- Event Handlers ---
    const handleClassNavigation = (classId: string) => {
        const courseToNavigate = courses.find(c => c._id === classId);
        if (courseToNavigate) setSelectedClass(courseToNavigate);
    };
    
    const handleUploadClick = (course?: Course) => {
        setSelectedCourseForUpload(course || null);
        setShowUploadModal(true);
    };

    const handleFileUploadSuccess = () => {
        setShowUploadModal(false);
        fetchDashboardData();
    };
    
    const handleCreateAssignment = (courseId: string) => {
        setSelectedCourseIdForAssessment(courseId);
        setIsAssessmentModalOpen(true);
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.code && course.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 rounded-xl">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading Resources...</p>
                </div>
            </div>
        );
    }

    if (selectedClass) {
        return (
            <ResourcesView 
                classId={selectedClass._id} 
                className={selectedClass.name} 
                classCode={selectedClass.code} 
                onBack={() => setSelectedClass(null)} 
                onUploadClick={() => handleUploadClick(selectedClass)}
                onUploadSuccess={fetchDashboardData} 
            />
        );
    }

    return (
        <div className="flex h-full min-h-0 bg-slate-50 text-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <Sidebar 
                onUploadClick={() => handleUploadClick()} 
                onCreateAssignment={() => handleCreateAssignment(courses[0]?._id)} 
                recentUploads={recentUploads} 
            />
            
            {/* main: flex column, never grows past its parent */}
            <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">

                {/* Fixed header */}
                <header className="flex-shrink-0 flex justify-between items-center px-4 py-2.5 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <h1 className="text-sm font-bold">Resources</h1>
                    </div>
                    <button 
                        onClick={() => handleUploadClick()} 
                        className="bg-blue-600 text-white font-semibold px-2.5 py-1 text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                    >
                        <UploadCloud size={13} /> Upload
                    </button>
                </header>

                {/* Body: two columns, each handles its own scroll */}
                <div className="flex-1 min-h-0 flex overflow-hidden">

                    {/* LEFT column: search bar (fixed) + scrollable card grid */}
                    <div className="flex-1 min-w-0 flex flex-col min-h-0 p-3 border-r border-slate-100">
                        {/* Search — never scrolls away */}
                        <div className="flex-shrink-0 relative mb-2">
                            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="Search by name or code..." 
                                className="w-full pl-8 pr-3 py-1.5 text-xs border bg-white border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" 
                            />
                        </div>
                        <p className="flex-shrink-0 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Your Classes</p>

                        {/* Scrollable grid — only this scrolls */}
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <div className="grid grid-cols-4 gap-2 pb-1 pr-0.5">
                                {filteredCourses.map((course) => (
                                    <CourseCard 
                                        key={course._id} 
                                        course={course} 
                                        onClick={() => handleClassNavigation(course._id)} 
                                        onUploadClick={() => handleUploadClick(course)} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT column: analytics + quick access, fixed width */}
                    <div className="w-48 flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto bg-white">
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Analytics</p>
                            <div className="space-y-1.5">
                                <StatCard icon={Folder} value={analytics.totalResources} label="Total Resources" color="blue" />
                                <StatCard icon={BarChart} value={analytics.averageDownloads} label="Downloads" color="green" />
                                <StatCard icon={LinkIcon} value={analytics.mostPopularResource} label="Most Popular" color="purple" isText />
                                <StatCard icon={Star} value={analytics.topClassEngagement} label="Top Class" color="amber" isText />
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Quick Access</p>
                            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                {courses.slice(0, 5).map(course => (
                                    <button 
                                        key={course._id} 
                                        onClick={() => handleClassNavigation(course._id)} 
                                        className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                                    >
                                        <Folder className="flex-shrink-0 text-amber-500" size={12} />
                                        <p className="font-medium text-[11px] text-slate-700 truncate">{course.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <UploadModal 
                isOpen={showUploadModal} 
                onClose={() => setShowUploadModal(false)} 
                onUploadSuccess={handleFileUploadSuccess} 
                selectedCourse={selectedCourseForUpload} 
                courses={courses} 
                onCourseSelect={setSelectedCourseForUpload} 
            />
            
            {selectedCourseIdForAssessment && (
                <AIAssessmentModal 
                    isOpen={isAssessmentModalOpen} 
                    onClose={() => setIsAssessmentModalOpen(false)} 
                    courseId={selectedCourseIdForAssessment} 
                    onAssessmentCreated={() =>{}} 
                />
            )}
        </div>
    );
};

export default ResourcesDashboard;