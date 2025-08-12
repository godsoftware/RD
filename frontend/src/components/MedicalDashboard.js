import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faChartLine,
  faStethoscope,
  faCalendarAlt,
  faDownload,
  faSearch,
  faFilter,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { enhancedPredictionService } from '../services/enhancedPredictionService';
import PatientModal from './PatientModal';
import PredictionHistoryModal from './PredictionHistoryModal';

// Chart.js kayıt
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardContainer = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 30px;
  color: white;
  
  h1 {
    font-size: 2.5rem;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .actions {
    display: flex;
    gap: 15px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    
    &.patients { background: linear-gradient(45deg, #4facfe, #00f2fe); }
    &.predictions { background: linear-gradient(45deg, #43e97b, #38f9d7); }
    &.accuracy { background: linear-gradient(45deg, #fa709a, #fee140); }
    &.reports { background: linear-gradient(45deg, #a8edea, #fed6e3); }
  }
  
  .stat-value {
    font-size: 2.2rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }
  
  .stat-label {
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .stat-change {
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 20px;
    
    &.positive {
      background: #e8f5e8;
      color: #2e7d32;
    }
    
    &.negative {
      background: #ffebee;
      color: #c62828;
    }
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  
  h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.3rem;
  }
`;

const RecentActivity = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  
  h3 {
    margin: 0 0 20px 0;
    color: #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  .activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    
    &.prediction {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }
    
    &.patient {
      background: linear-gradient(45deg, #f093fb, #f5576c);
      color: white;
    }
  }
  
  .activity-content {
    flex: 1;
    
    .activity-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 3px;
    }
    
    .activity-subtitle {
      font-size: 0.85rem;
      color: #666;
    }
  }
  
  .activity-time {
    font-size: 0.8rem;
    color: #999;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.primary {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    
    &:hover {
      background: #667eea;
      color: white;
    }
  }
`;

const MedicalDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalPredictions: 0,
    averageAccuracy: 0,
    reportsGenerated: 0
  });
  
  const [chartData, setChartData] = useState({
    predictions: {
      labels: [],
      datasets: []
    },
    modelDistribution: {
      labels: [],
      datasets: []
    }
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Dashboard istatistiklerini yükle
      const [statsData, historyData] = await Promise.all([
        enhancedPredictionService.getEnhancedPredictionStats(),
        enhancedPredictionService.getEnhancedPredictionHistory(1, 20)
      ]);

      setStats({
        totalPatients: statsData.totalPatients || 0,
        totalPredictions: statsData.totalPredictions || 0,
        averageAccuracy: statsData.averageConfidence || 0,
        reportsGenerated: statsData.reportsGenerated || 0
      });

      // Chart data hazırla
      const last7Days = getLast7Days();
      const predictionCounts = last7Days.map(date => {
        return historyData.predictions?.filter(p => 
          new Date(p.createdAt).toDateString() === date.toDateString()
        ).length || 0;
      });

      setChartData({
        predictions: {
          labels: last7Days.map(date => date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })),
          datasets: [{
            label: 'Günlük Tahminler',
            data: predictionCounts,
            borderColor: 'rgb(102, 126, 234)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        modelDistribution: {
          labels: ['Pneumonia', 'Brain Tumor', 'Tuberculosis'],
          datasets: [{
            data: [
              statsData.modelDistribution?.pneumonia || 0,
              statsData.modelDistribution?.brainTumor || 0,
              statsData.modelDistribution?.tuberculosis || 0
            ],
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56'
            ],
            hoverBackgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56'
            ]
          }]
        }
      });

      // Recent activity
      setRecentActivity(
        historyData.predictions?.slice(0, 5).map(pred => ({
          id: pred.id,
          type: 'prediction',
          title: `${pred.modelType} tahmini yapıldı`,
          subtitle: `Güven: ${pred.confidence}% - ${pred.prediction}`,
          time: formatTimeAgo(pred.createdAt),
          icon: 'prediction'
        })) || []
      );

    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return `${Math.floor(diffInMinutes / 1440)} gün önce`;
  };

  const exportReport = async () => {
    try {
      // Report export logic here
      console.log('Exporting report...');
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'white' }}>
          <div>Yükleniyor...</div>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <h1>Medical AI Dashboard</h1>
        <div className="actions">
          <Button className="secondary" onClick={exportReport}>
            <FontAwesomeIcon icon={faDownload} />
            Rapor İndir
          </Button>
          <Button className="primary" onClick={() => setShowPatientModal(true)}>
            <FontAwesomeIcon icon={faPlus} />
            Yeni Hasta
          </Button>
        </div>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="stat-header">
            <div className="stat-icon patients">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="stat-change positive">+12%</div>
          </div>
          <div className="stat-value">{stats.totalPatients}</div>
          <div className="stat-label">Toplam Hasta</div>
        </StatCard>

        <StatCard>
          <div className="stat-header">
            <div className="stat-icon predictions">
              <FontAwesomeIcon icon={faStethoscope} />
            </div>
            <div className="stat-change positive">+8%</div>
          </div>
          <div className="stat-value">{stats.totalPredictions}</div>
          <div className="stat-label">Toplam Tahmin</div>
        </StatCard>

        <StatCard>
          <div className="stat-header">
            <div className="stat-icon accuracy">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="stat-change positive">+2%</div>
          </div>
          <div className="stat-value">{stats.averageAccuracy}%</div>
          <div className="stat-label">Ortalama Doğruluk</div>
        </StatCard>

        <StatCard>
          <div className="stat-header">
            <div className="stat-icon reports">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="stat-change positive">+15%</div>
          </div>
          <div className="stat-value">{stats.reportsGenerated}</div>
          <div className="stat-label">Oluşturulan Rapor</div>
        </StatCard>
      </StatsGrid>

      <ChartsGrid>
        <ChartCard>
          <h3>Günlük Tahmin Aktivitesi</h3>
          <Line 
            data={chartData.predictions}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </ChartCard>

        <ChartCard>
          <h3>Model Kullanım Dağılımı</h3>
          <Doughnut 
            data={chartData.modelDistribution}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
              },
            }}
          />
        </ChartCard>
      </ChartsGrid>

      <RecentActivity>
        <h3>
          Son Aktiviteler
          <Button 
            className="secondary" 
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setShowHistoryModal(true)}
          >
            Tümünü Gör
          </Button>
        </h3>
        
        {recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <ActivityItem key={index}>
              <div className={`activity-icon ${activity.icon}`}>
                <FontAwesomeIcon icon={faStethoscope} />
              </div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-subtitle">{activity.subtitle}</div>
              </div>
              <div className="activity-time">{activity.time}</div>
            </ActivityItem>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Henüz aktivite bulunmuyor
          </div>
        )}
      </RecentActivity>

      {showPatientModal && (
        <PatientModal 
          onClose={() => setShowPatientModal(false)}
          onSuccess={loadDashboardData}
        />
      )}

      {showHistoryModal && (
        <PredictionHistoryModal 
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </DashboardContainer>
  );
};

export default MedicalDashboard;
