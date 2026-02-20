import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const downloadItineraryPDF = (itinerary, expenses = []) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 100);
    doc.text(itinerary.destination || 'Trip Itinerary', pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`${itinerary.startDate} to ${itinerary.endDate}`, pageWidth / 2, 30, { align: 'center' });

    let yPos = 45;

    // 1. Trip Overview
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Trip Overview', 14, yPos);
    yPos += 5;

    doc.autoTable({
        startY: yPos,
        head: [['Budget', 'Travelers', 'Interests']],
        body: [[
            `₹${itinerary.budget}`,
            itinerary.travelers,
            (itinerary.interests || []).join(', ')
        ]],
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244] },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // 2. Expenses Summary
    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    doc.text(`Expenses (Total: ₹${totalExpenses.toFixed(2)})`, 14, yPos);
    yPos += 5;

    if (expenses.length > 0) {
        const expenseData = expenses.map(e => [
            e.description,
            e.category,
            `₹${parseFloat(e.amount).toFixed(2)}`,
            e.paidBy || '-'
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Description', 'Category', 'Amount', 'Paid By']],
            body: expenseData,
            theme: 'striped',
            headStyles: { fillColor: [255, 128, 66] }
        });
        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('No expenses recorded.', 14, yPos);
        yPos += 15;
    }

    // 3. Daily Plan
    const plan = itinerary.dailyPlan || itinerary.daily_plan;
    if (plan && Array.isArray(plan) && plan.length > 0) {
        // Check generic PDF page height to add page breaks
        if (yPos > 250) { doc.addPage(); yPos = 20; }

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Daily Itinerary', 14, yPos);
        yPos += 10;

        plan.forEach((day, index) => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }

            doc.setFontSize(14);
            doc.setTextColor(50, 50, 50);
            doc.text(`Day ${day.day}: ${day.date}`, 14, yPos);
            yPos += 7;

            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            if (Array.isArray(day.activities)) {
                day.activities.forEach(activity => {
                    const activityText = typeof activity === 'string' ? activity : activity.title || JSON.stringify(activity);
                    const splitText = doc.splitTextToSize(`• ${activityText}`, 180);
                    doc.text(splitText, 20, yPos);
                    yPos += (splitText.length * 5) + 2;
                });
            }
            yPos += 5;
        });
        yPos += 10;
    }

    // 4. Packing List
    const packingList = itinerary.packingList || itinerary.packing_list;
    if (packingList && typeof packingList === 'object') {
        if (yPos > 250) { doc.addPage(); yPos = 20; }

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Suggested Packing List', 14, yPos);
        yPos += 10;

        const categories = Object.keys(packingList);
        // Create table logic for packing list
        const rows = [];
        let maxLength = 0;
        categories.forEach(cat => {
            if (Array.isArray(packingList[cat])) {
                maxLength = Math.max(maxLength, packingList[cat].length);
            }
        });

        // Transpose data for table? No, just list by category
        // Actually, let's just print list items to avoid complex table math
        categories.forEach(cat => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }

            doc.setFontSize(14);
            doc.setTextColor(0, 100, 0);
            doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), 14, yPos);
            yPos += 7;

            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60);
            (packingList[cat] || []).forEach(item => {
                doc.text(`• ${item}`, 20, yPos);
                yPos += 6;
            });
            yPos += 5;
        });
    }

    doc.save(`Itinerary_${itinerary.destination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};
