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
            <div className="flex h-screen items-center justify-center bg-slate-50">
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
        <div className="flex h-screen bg-slate-50 text-slate-900">
            <Sidebar 
                onUploadClick={() => handleUploadClick()} 
                onCreateAssignment={() => handleCreateAssignment(courses[0]?._id)} 
                recentUploads={recentUploads} 
            />
            
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Resources</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => handleUploadClick()} 
                            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                           <UploadCloud size={18} /> Upload
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="Search your classes by name or code..." 
                                className="w-full pl-12 pr-4 py-3 border bg-white border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                        </div>

                        <section>
                            <h2 className="text-xl font-bold text-slate-700 mb-4">Your Classes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredCourses.map((course) => (
                                    <CourseCard 
                                        key={course._id} 
                                        course={course} 
                                        onClick={() => handleClassNavigation(course._id)} 
                                        onUploadClick={() => handleUploadClick(course)} 
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="xl:col-span-1 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-slate-700 mb-4">Resource Analytics</h2>
                            <div className="space-y-4">
                               <StatCard icon={Folder} value={analytics.totalResources} label="Total Resources" color="blue" />
                               <StatCard icon={BarChart} value={analytics.averageDownloads} label="Avg. Downloads" color="green" />
                               <StatCard icon={LinkIcon} value={analytics.mostPopularResource} label="Most Popular" color="purple" isText />
                               <StatCard icon={Star} value={analytics.topClassEngagement} label="Top Class" color="amber" isText />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-700 mb-4">Quick Access</h2>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-1">
                                {courses.slice(0, 3).map(course => (
                                    <button 
                                        key={course._id} 
                                        onClick={() => handleClassNavigation(course._id)} 
                                        className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md transition-colors"
                                    >
                                        <Folder className="flex-shrink-0 text-amber-500" size={20} />
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">{course.name}</p>
                                            <p className="text-xs text-slate-500">View resources</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
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
                    onAssessmentCreated={() => {}} 
                />
            )}
        </div>
    );
};

export default ResourcesDashboard;