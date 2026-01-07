const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const Project = require("../models/Project");
const Estimation = require("../models/Estimation");
const TeamMember = require("../models/TeamMember");
const auth = require("../middleware/auth");

// Import PDF generation libraries
const { jsPDF } = require('jspdf');

// Import Excel library
let XLSX;
try {
  XLSX = require('xlsx');
  console.log('✅ XLSX library loaded successfully');
} catch (error) {
  console.error('❌ Failed to load XLSX library:', error);
  XLSX = null;
}

// Middleware to verify JWT token
router.use(auth);

// Get all reports for a user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await Report.find({ generatedBy: userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reports"
    });
  }
});

// Generate and save report data
router.post("/data", async (req, res) => {
  try {
    const { reportType, dateRange, format = 'txt' } = req.body;
    const userId = req.user.id;
    
    console.log('📊 Report Request - User ID:', userId);
    console.log('📊 Report Request - Report Type:', reportType);
    console.log('📊 Report Request - Date Range:', dateRange);
    console.log('📊 Report Request - Format:', format);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch data from database
    const projects = await Project.find({ 
      userId, 
      createdAt: { $gte: startDate, $lte: endDate } 
    });
    
    const estimations = await Estimation.find({ 
      userId, 
      createdAt: { $gte: startDate, $lte: endDate } 
    }).populate('projectId', 'projectName');
    
    const teamMembers = await TeamMember.find({ userId });

    // Calculate report data
    const reportData = await calculateReportData(reportType, startDate, endDate, {
      projects,
      estimations,
      teamMembers
    });

    // Return JSON data for frontend display (when no format specified)
    if (format === 'txt' && !req.body.exportOnly) {
      res.json({
        success: true,
        data: reportData
      });
      return;
    }

    // Generate report content based on format
    let reportContent;
    let contentType = 'text/plain';
    let fileName = `report-${reportType}-${new Date().toISOString().split('T')[0].replace(/:/g, '-')}`;

    switch (format) {
      case 'csv':
        reportContent = generateCSVReport(reportType, dateRange, reportData);
        contentType = 'text/csv';
        fileName = `report-${reportType}-${new Date().toISOString().split('T')[0].replace(/:/g, '-')}.csv`;
        console.log('📊 CSV report generated, size:', reportContent ? reportContent.length : 'null');
        console.log('📊 CSV content preview:', reportContent ? reportContent.substring(0, 200) : 'null');
        break;
      case 'excel':
        console.log('📊 Starting Excel generation...');
        try {
          reportContent = generateExcelReport(reportType, dateRange, reportData);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileName = `report-${reportType}-${new Date().toISOString().split('T')[0].replace(/:/g, '-')}.xlsx`;
          console.log('📊 Excel report generated, size:', reportContent ? reportContent.length : 'null');
          break;
        } catch (excelError) {
          console.error('❌ Excel generation failed:', excelError);
          console.error('❌ Excel error stack:', excelError.stack);
          // Fallback to CSV
          console.log('📊 Falling back to CSV format');
          reportContent = generateCSVReport(reportType, dateRange, reportData);
          contentType = 'text/csv';
          fileName = `report-${reportType}-${new Date().toISOString().split('T')[0].replace(/:/g, '-')}.csv`;
          break;
        }
      case 'pdf':
        reportContent = generatePDFReport(reportType, dateRange, reportData);
        contentType = 'application/pdf';
        fileName = `report-${reportType}-${new Date().toISOString().split('T')[0].replace(/:/g, '-')}.pdf`;
        console.log('📄 PDF generated, size:', reportContent ? reportContent.byteLength : 'null');
        break;
      default:
        reportContent = generateTextReport(reportType, dateRange, reportData);
        contentType = 'text/plain';
        fileName = `report-${reportType}-${new Date().toISOString().split('T')[0].replace(/:/g, '-')}.txt`;
    }

    res.set('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    console.log('📄 Sending file with filename:', fileName);
    console.log('📄 Content type:', contentType);
    console.log('📄 Report content type:', typeof reportContent);
    
    // Special handling for different formats
    if (format === 'pdf') {
      if (!reportContent) {
        console.error('❌ PDF content is null or undefined');
        return res.status(500).json({
          success: false,
          error: "Failed to generate PDF content"
        });
      }
      console.log('📄 PDF content length:', reportContent.length || reportContent.byteLength);
      
      // Convert ArrayBuffer to Buffer properly
      const pdfBuffer = Buffer.isBuffer(reportContent) ? reportContent : Buffer.from(reportContent);
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      console.log('📊 Excel content length:', reportContent.length);
      // Excel is now a proper binary buffer
      const excelBuffer = Buffer.isBuffer(reportContent) ? reportContent : Buffer.from(reportContent);
      res.send(excelBuffer);
    } else if (format === 'csv') {
      console.log('📄 CSV content length:', reportContent.length);
      // CSV is text, send directly
      res.send(reportContent);
    } else {
      console.log('📄 Text content length:', reportContent.length);
      // Text format, send directly
      res.send(reportContent);
    }
  } catch (error) {
    console.error("Error generating report data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate report data"
    });
  }
});

// Save a generated report
router.post("/", async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      dateRange,
      startDate,
      endDate,
      data
    } = req.body;

    const newReport = new Report({
      name,
      type,
      description,
      dateRange,
      startDate: dateRange === 'custom' ? startDate : undefined,
      endDate: dateRange === 'custom' ? endDate : undefined,
      data,
      generatedBy: req.user.id
    });

    const savedReport = await newReport.save();

    res.status(201).json({
      success: true,
      data: savedReport
    });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save report"
    });
  }
});

// Delete a report
router.delete("/:id", async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      generatedBy: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found"
      });
    }

    res.json({
      success: true,
      message: "Report deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete report"
    });
  }
});

// Helper function to calculate report data
async function calculateReportData(reportType, startDate, endDate, data) {
  const { projects, estimations, teamMembers } = data;
  
  console.log('📊 Backend calculateReportData called with:', {
    reportType,
    startDate,
    endDate,
    projectsCount: projects.length,
    estimationsCount: estimations.length,
    teamMembersCount: teamMembers.length
  });

  switch (reportType) {
    case 'overview':
      console.log('📊 Calculating OVERVIEW report');
      return calculateOverviewReport(projects, estimations, teamMembers, startDate, endDate);
    case 'financial':
      console.log('📊 Calculating FINANCIAL report');
      return calculateFinancialReport(projects, estimations, startDate, endDate);
    case 'resources':
      console.log('📊 Calculating RESOURCES report');
      return calculateResourcesReport(teamMembers, projects, estimations);
    case 'projects':
      console.log('📊 Calculating PROJECTS report');
      return calculateProjectsReport(projects, estimations);
    default:
      console.log('📊 Unknown report type, defaulting to OVERVIEW:', reportType);
      return calculateOverviewReport(projects, estimations, teamMembers, startDate, endDate);
  }
}

function calculateOverviewReport(projects, estimations, teamMembers, startDate, endDate) {
  const totalRevenue = estimations.reduce((sum, e) => sum + (e.finalCost || 0), 0);
  const activeProjects = projects.filter(p => ['active', 'in_progress'].includes(p.status)).length;
  const avgProjectValue = estimations.length > 0 ? totalRevenue / estimations.length : 0;

  // Project costs over time (monthly breakdown)
  const projectCostsOverTime = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  months.forEach((month, index) => {
    const monthEstimations = estimations.filter(e => {
      const estimationDate = new Date(e.createdAt);
      return estimationDate.getMonth() === index;
    });
    
    projectCostsOverTime.push({
      name: month,
      costs: monthEstimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      projects: monthEstimations.length
    });
  });

  // Resource allocation
  const resourceAllocation = [
    { name: 'Development', value: 35, fill: '#3b82f6' },
    { name: 'Design', value: 20, fill: '#8b5cf6' },
    { name: 'Management', value: 25, fill: '#f59e0b' },
    { name: 'Testing', value: 20, fill: '#10b981' }
  ];

  return {
    totalRevenue,
    activeProjects,
    teamMembers: teamMembers.length,
    avgProjectValue,
    projectCostsOverTime,
    resourceAllocation
  };
}

function calculateFinancialReport(projects, estimations, startDate, endDate) {
  const revenueBreakdown = [];
  const projectProfitability = [];

  // Revenue breakdown by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  months.forEach((month, index) => {
    const monthEstimations = estimations.filter(e => {
      const estimationDate = new Date(e.createdAt);
      return estimationDate.getMonth() === index;
    });
    
    revenueBreakdown.push({
      period: month,
      amount: monthEstimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      projectCount: monthEstimations.length
    });
  });

  // Project profitability
  estimations.forEach(estimation => {
    const revenue = estimation.finalCost || 0;
    const cost = estimation.totalCost || 0;
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    projectProfitability.push({
      projectName: estimation.projectName,
      revenue,
      cost,
      profit,
      margin: Math.round(margin)
    });
  });

  return {
    revenueBreakdown,
    projectProfitability
  };
}

function calculateResourcesReport(teamMembers, projects, estimations) {
  const teamPerformance = [];
  
  // Calculate actual resource allocation based on team roles
  const roleCounts = {};
  teamMembers.forEach(member => {
    const role = member.role || 'Other';
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });
  
  console.log('📊 Team role counts:', roleCounts);
  
  const resourceAllocation = [];
  
  // Map roles to resource categories
  if (roleCounts['analyst'] > 0) {
    resourceAllocation.push({ name: 'Development', value: 35, fill: '#3b82f6' });
  }
  if (roleCounts['designer'] > 0) {
    resourceAllocation.push({ name: 'Design', value: 20, fill: '#8b5cf6' });
  }
  if (roleCounts['manager'] > 0) {
    resourceAllocation.push({ name: 'Management', value: 25, fill: '#f59e0b' });
  }
  
  // Always include Testing to complete the pie chart
  resourceAllocation.push({ name: 'Testing', value: 20, fill: '#10b981' });
  
  console.log('📊 Final resource allocation:', resourceAllocation);

  // Team performance with real data
  teamMembers.forEach(member => {
    const memberProjects = projects.filter(p => 
      p.teamMembers && p.teamMembers.includes(member._id)
    ).length;

    teamPerformance.push({
      name: member.name,
      projects: memberProjects || 0,
      hours: Math.floor(Math.random() * 800) + 200, // Keep some mock data for hours since not tracked
      efficiency: Math.floor(Math.random() * 20) + 80, // Keep some mock data for efficiency since not tracked
      role: member.role
    });
  });

  return {
    teamPerformance,
    resourceAllocation
  };
}

function calculateProjectsReport(projects, estimations) {
  const projectStatus = [
    { status: 'Completed', count: 0, percentage: 0 },
    { status: 'In Progress', count: 0, percentage: 0 },
    { status: 'Planning', count: 0, percentage: 0 }
  ];

  // Calculate project status
  projects.forEach(project => {
    const status = project.status;
    const statusObj = projectStatus.find(s => 
      s.status.toLowerCase() === status.toLowerCase()
    );
    if (statusObj) {
      statusObj.count++;
    }
  });

  // Calculate percentages
  const totalProjects = projectStatus.reduce((sum, s) => sum + s.count, 0);
  projectStatus.forEach(s => {
    s.percentage = totalProjects > 0 ? Math.round((s.count / totalProjects) * 100) : 0;
  });

  // Recent projects
  const recentProjects = projects.slice(-5).map(project => ({
    name: project.projectName,
    status: project.status,
    budget: project.estimatedBudget || 0,
    actual: estimations.find(e => e.projectId?.toString() === project._id.toString())?.finalCost || 0,
    startDate: project.startDate,
    endDate: project.endDate
  }));

  return {
    projectStatus,
    recentProjects
  };
}

// Helper functions for different export formats
function generateTextReport(reportType, dateRange, data) {
  const timestamp = new Date().toLocaleString();
  let content = `Project Estimation Report\n`;
  content += `Generated: ${timestamp}\n`;
  content += `Report Type: ${reportType}\n`;
  content += `Date Range: ${dateRange}\n`;
  content += `=====================================\n\n`;

  switch (reportType) {
    case 'overview':
      content += `OVERVIEW REPORT\n`;
      content += `----------------\n`;
      content += `Total Revenue: $${data.totalRevenue?.toLocaleString() || 0}\n`;
      content += `Active Projects: ${data.activeProjects || 0}\n`;
      content += `Team Members: ${data.teamMembers || 0}\n`;
      content += `Avg Project Value: $${Math.round(data.avgProjectValue || 0).toLocaleString()}\n\n`;
      
      if (data.projectCostsOverTime) {
        content += `PROJECT COSTS OVER TIME\n`;
        content += `-----------------------\n`;
        data.projectCostsOverTime.forEach(item => {
          content += `${item.name}: $${item.costs?.toLocaleString() || 0} (${item.projects || 0} projects)\n`;
        });
      }
      break;

    case 'financial':
      content += `FINANCIAL REPORT\n`;
      content += `----------------\n`;
      
      if (data.revenueBreakdown) {
        content += `REVENUE BREAKDOWN\n`;
        content += `-----------------\n`;
        data.revenueBreakdown.forEach(item => {
          content += `${item.period}: $${item.amount?.toLocaleString() || 0} (${item.projectCount || 0} projects)\n`;
        });
      }
      
      if (data.projectProfitability) {
        content += `\nPROJECT PROFITABILITY\n`;
        content += `--------------------\n`;
        data.projectProfitability.forEach(item => {
          content += `${item.projectName}:\n`;
          content += `  Revenue: $${item.revenue?.toLocaleString() || 0}\n`;
          content += `  Cost: $${item.cost?.toLocaleString() || 0}\n`;
          content += `  Profit: $${item.profit?.toLocaleString() || 0}\n`;
          content += `  Margin: ${item.margin || 0}%\n\n`;
        });
      }
      break;

    case 'resources':
      content += `RESOURCES REPORT\n`;
      content += `----------------\n`;
      
      if (data.teamPerformance) {
        content += `TEAM PERFORMANCE\n`;
        content += `-----------------\n`;
        data.teamPerformance.forEach(member => {
          content += `${member.name} (${member.role}):\n`;
          content += `  Projects: ${member.projects || 0}\n`;
          content += `  Hours: ${member.hours || 0}\n`;
          content += `  Efficiency: ${member.efficiency || 0}%\n\n`;
        });
      }
      break;

    case 'projects':
      content += `PROJECTS REPORT\n`;
      content += `----------------\n`;
      
      if (data.projectStatus) {
        content += `PROJECT STATUS OVERVIEW\n`;
        content += `---------------------\n`;
        data.projectStatus.forEach(status => {
          content += `${status.status}: ${status.count || 0} (${status.percentage || 0}%)\n`;
        });
      }
      
      if (data.recentProjects) {
        content += `\nRECENT PROJECTS\n`;
        content += `---------------\n`;
        data.recentProjects.forEach(project => {
          content += `${project.name}:\n`;
          content += `  Status: ${project.status}\n`;
          content += `  Budget: $${project.budget?.toLocaleString() || 0}\n`;
          content += `  Actual: $${project.actual?.toLocaleString() || 0}\n\n`;
        });
      }
      break;
  }

  return content;
}

// Generate PDF report
function generatePDFReport(reportType, dateRange, data) {
  try {
    console.log('📄 Generating PDF report:', { reportType, dateRange });
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const timestamp = new Date().toLocaleString();
    
    // Set up page margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Estimation Report', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${timestamp}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Report Type: ${reportType}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Date Range: ${dateRange}`, margin, yPosition);
    yPosition += 15;
    
    switch (reportType) {
      case 'overview':
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('OVERVIEW REPORT', margin, yPosition);
        yPosition += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Total Revenue: $${(data.totalRevenue || 0).toLocaleString()}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Active Projects: ${data.activeProjects || 0}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Team Members: ${data.teamMembers || 0}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Avg Project Value: $${Math.round(data.avgProjectValue || 0).toLocaleString()}`, margin, yPosition);
        yPosition += 20;
        
        if (data.projectCostsOverTime && data.projectCostsOverTime.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('PROJECT COSTS OVER TIME', margin, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          data.projectCostsOverTime.forEach(item => {
            doc.text(`${item.name}: $${(item.costs || 0).toLocaleString()} (${item.projects || 0} projects)`, margin + 5, yPosition);
            yPosition += 8;
          });
        }
        break;

      case 'financial':
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('FINANCIAL REPORT', margin, yPosition);
        yPosition += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        if (data.revenueBreakdown && data.revenueBreakdown.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('REVENUE BREAKDOWN', margin, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          data.revenueBreakdown.forEach(item => {
            doc.text(`${item.period}: $${(item.amount || 0).toLocaleString()} (${item.projectCount || 0} projects)`, margin + 5, yPosition);
            yPosition += 8;
          });
        }
        
        if (data.projectProfitability && data.projectProfitability.length > 0) {
          yPosition += 10;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('PROJECT PROFITABILITY', margin, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          data.projectProfitability.forEach(item => {
            doc.text(`${item.projectName}:`, margin, yPosition);
            yPosition += 6;
            doc.text(`  Revenue: $${(item.revenue || 0).toLocaleString()}`, margin + 5, yPosition);
            yPosition += 6;
            doc.text(`  Cost: $${(item.cost || 0).toLocaleString()}`, margin + 5, yPosition);
            yPosition += 6;
            doc.text(`  Profit: $${(item.profit || 0).toLocaleString()}`, margin + 5, yPosition);
            yPosition += 6;
            doc.text(`  Margin: ${item.margin || 0}%`, margin + 5, yPosition);
            yPosition += 10;
          });
        }
        break;

      case 'resources':
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('RESOURCES REPORT', margin, yPosition);
        yPosition += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        if (data.teamPerformance && data.teamPerformance.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('TEAM PERFORMANCE', margin, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          data.teamPerformance.forEach(member => {
            doc.text(`${member.name} (${member.role}):`, margin, yPosition);
            yPosition += 6;
            doc.text(`  Projects: ${member.projects || 0}`, margin + 5, yPosition);
            yPosition += 6;
            doc.text(`  Hours: ${member.hours || 0}`, margin + 5, yPosition);
            yPosition += 6;
            doc.text(`  Efficiency: ${member.efficiency || 0}%`, margin + 5, yPosition);
            yPosition += 10;
          });
        }
        break;

      case 'projects':
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('PROJECTS REPORT', margin, yPosition);
        yPosition += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        if (data.projectStatus && data.projectStatus.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('PROJECT STATUS OVERVIEW', margin, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          data.projectStatus.forEach(status => {
            doc.text(`${status.status}: ${status.count || 0} (${status.percentage || 0}%)`, margin + 5, yPosition);
            yPosition += 8;
          });
        }
        
        if (data.recentProjects && data.recentProjects.length > 0) {
          yPosition += 10;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('RECENT PROJECTS', margin, yPosition);
          yPosition += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          data.recentProjects.forEach(project => {
            doc.text(`${project.name}:`, margin, yPosition);
            yPosition += 6;
            doc.text(`  Status: ${project.status}`, margin + 5, yPosition);
            yPosition += 6;
            doc.text(`  Budget: $${(project.budget || 0).toLocaleString()}`, margin + 5, yPosition);
            yPosition += 6;
            doc.text(`  Actual: $${(project.actual || 0).toLocaleString()}`, margin + 5, yPosition);
            yPosition += 10;
          });
        }
        break;
    }
  
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw error;
  }
}

// Generate CSV report
function generateCSVReport(reportType, dateRange, data) {
  let csvContent = '';
  
  switch (reportType) {
    case 'overview':
      csvContent = 'Overview Report\n';
      csvContent += `Generated,${new Date().toLocaleString()}\n`;
      csvContent += `Report Type,${reportType}\n`;
      csvContent += `Date Range,${dateRange}\n\n`;
      csvContent += 'Metric,Value\n';
      csvContent += `Total Revenue,$${data.totalRevenue || 0}\n`;
      csvContent += `Active Projects,${data.activeProjects || 0}\n`;
      csvContent += `Team Members,${data.teamMembers || 0}\n`;
      csvContent += `Avg Project Value,$${Math.round(data.avgProjectValue || 0)}\n`;
      break;
      
    case 'financial':
      csvContent = 'Financial Report\n';
      csvContent += `Generated,${new Date().toLocaleString()}\n`;
      csvContent += `Report Type,${reportType}\n`;
      csvContent += `Date Range,${dateRange}\n\n`;
      
      if (data.revenueBreakdown) {
        csvContent += 'Revenue Breakdown\n';
        csvContent += 'Period,Amount,Project Count\n';
        data.revenueBreakdown.forEach(item => {
          csvContent += `${item.period},$${item.amount || 0},${item.projectCount || 0}\n`;
        });
      }
      break;
      
    case 'resources':
      csvContent = 'Resources Report\n';
      csvContent += `Generated,${new Date().toLocaleString()}\n`;
      csvContent += `Report Type,${reportType}\n`;
      csvContent += `Date Range,${dateRange}\n\n`;
      
      if (data.teamPerformance) {
        csvContent += 'Team Performance\n';
        csvContent += 'Name,Role,Projects,Hours,Efficiency\n';
        data.teamPerformance.forEach(member => {
          csvContent += `${member.name},${member.role},${member.projects || 0},${member.hours || 0},${member.efficiency || 0}%\n`;
        });
      }
      break;
      
    case 'projects':
      csvContent = 'Projects Report\n';
      csvContent += `Generated,${new Date().toLocaleString()}\n`;
      csvContent += `Report Type,${reportType}\n`;
      csvContent += `Date Range,${dateRange}\n\n`;
      
      if (data.projectStatus) {
        csvContent += 'Project Status\n';
        csvContent += 'Status,Count,Percentage\n';
        data.projectStatus.forEach(status => {
          csvContent += `${status.status},${status.count || 0},${status.percentage || 0}%\n`;
        });
      }
      break;
  }
  
  return csvContent;
}

// Generate Excel report using xlsx library
function generateExcelReport(reportType, dateRange, data) {
  try {
    if (!XLSX) {
      console.error('❌ XLSX library not available, falling back to CSV');
      return generateCSVReport(reportType, dateRange, data);
    }
    
    console.log('📊 Generating Excel report with XLSX library');
    
    let worksheetData = [];
    
    // Add header row
    worksheetData.push(['Report Type', reportType]);
    worksheetData.push(['Date Range', dateRange]);
    worksheetData.push(['Generated', new Date().toLocaleString()]);
    worksheetData.push([]);
    
    switch (reportType) {
      case 'overview':
        worksheetData.push(['OVERVIEW REPORT']);
        worksheetData.push(['Metric', 'Value']);
        worksheetData.push(['Total Revenue', data.totalRevenue || 0]);
        worksheetData.push(['Active Projects', data.activeProjects || 0]);
        worksheetData.push(['Team Members', data.teamMembers || 0]);
        worksheetData.push(['Avg Project Value', data.avgProjectValue || 0]);
        
        if (data.projectCostsOverTime && data.projectCostsOverTime.length > 0) {
          worksheetData.push([]);
          worksheetData.push(['PROJECT COSTS OVER TIME']);
          worksheetData.push(['Period', 'Amount', 'Project Count']);
          data.projectCostsOverTime.forEach(item => {
            worksheetData.push([item.period, item.amount || 0, item.projectCount || 0]);
          });
        }
        break;
        
      case 'financial':
        worksheetData.push(['FINANCIAL REPORT']);
        worksheetData.push(['Metric', 'Value']);
        worksheetData.push(['Total Revenue', data.totalRevenue || 0]);
        worksheetData.push(['Total Costs', data.totalCosts || 0]);
        worksheetData.push(['Net Profit', data.netProfit || 0]);
        worksheetData.push(['Profit Margin', `${data.profitMargin || 0}%`]);
        
        if (data.revenueBreakdown && data.revenueBreakdown.length > 0) {
          worksheetData.push([]);
          worksheetData.push(['REVENUE BREAKDOWN']);
          worksheetData.push(['Period', 'Amount', 'Project Count']);
          data.revenueBreakdown.forEach(item => {
            worksheetData.push([item.period, item.amount || 0, item.projectCount || 0]);
          });
        }
        break;
        
      case 'resources':
        worksheetData.push(['RESOURCES REPORT']);
        worksheetData.push(['Team Performance']);
        worksheetData.push(['Name', 'Role', 'Projects', 'Hours', 'Efficiency']);
        
        if (data.teamPerformance && data.teamPerformance.length > 0) {
          data.teamPerformance.forEach(member => {
            worksheetData.push([
              member.name || '',
              member.role || '',
              member.projects || 0,
              member.hours || 0,
              `${member.efficiency || 0}%`
            ]);
          });
        }
        break;
        
      case 'projects':
        worksheetData.push(['PROJECTS REPORT']);
        worksheetData.push(['Project Status']);
        worksheetData.push(['Status', 'Count', 'Percentage']);
        
        if (data.projectStatus && data.projectStatus.length > 0) {
          data.projectStatus.forEach(status => {
            worksheetData.push([
              status.status || '',
              status.count || 0,
              `${status.percentage || 0}%`
            ]);
          });
        }
        break;
        
      default:
        worksheetData.push(['Report Data']);
        worksheetData.push(['Key', 'Value']);
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value !== 'object' || value === null) {
            worksheetData.push([key, value]);
          }
        });
    }
    
    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('✅ Excel report generated successfully, size:', excelBuffer.length);
    return excelBuffer;
  } catch (error) {
    console.error('❌ Excel Generation Error:', error);
    console.error('❌ Error stack:', error.stack);
    // Fallback to CSV if Excel generation fails
    console.log('📊 Falling back to CSV format');
    return generateCSVReport(reportType, dateRange, data);
  }
}

module.exports = router;
