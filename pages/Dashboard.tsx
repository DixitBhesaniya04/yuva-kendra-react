import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { db } from '../services/mockDb';
import { WeeklyReport, Kendra } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, UserPlus, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const allReports = await db.getReports();
      const allKendras = await db.getKendras();

      if (user?.role === 'admin') {
        setReports(allReports);
        setKendras(allKendras);
      } else {
        // Filter for member
        setReports(allReports.filter(r => r.kendra_id === user?.kendra_id));
        setKendras(allKendras.filter(k => k.id === user?.kendra_id));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Aggregation Logic
  const totalReports = reports.length;
  const avgAttendance = reports.length > 0 
    ? Math.round(reports.reduce((acc, curr) => acc + curr.yuva_kendra_attendance, 0) / reports.length) 
    : 0;

  // Chart Data Preparation (Last 5 Reports)
  const chartData = reports
    .sort((a, b) => new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime())
    .slice(-5)
    .map(r => ({
      name: new Date(r.week_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      'Yuva Kendra': r.yuva_kendra_attendance,
      'Bhavferni': r.bhavferni_attendance,
      'Pravachan': r.pravachan_attendance
    }));

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {user?.role === 'admin' ? 'Admin Dashboard' : 'My Kendra Dashboard'}
          </h2>
          <p className="text-gray-500">Overview of activities and attendance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Reports" 
          value={totalReports} 
          icon={FileTextIcon} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Avg Attendance" 
          value={avgAttendance} 
          icon={Users} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Active Kendras" 
          value={kendras.length} 
          icon={BuildingIcon} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Participation Rate" 
          value="84%" 
          icon={TrendingUp} 
          color="bg-orange-500" 
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6">Attendance Trends (Last 5 Weeks)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="Yuva Kendra" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Bhavferni" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pravachan" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`${color} p-3 rounded-lg text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const FileTextIcon = (props: any) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);

const BuildingIcon = (props: any) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
);

export default Dashboard;