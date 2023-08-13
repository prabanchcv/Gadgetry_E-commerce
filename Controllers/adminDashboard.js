const moment = require('moment');
const Sale = require('../Models/orderModel')
const Order = require('../Models/orderModel')
// const puppeteer = require('puppeteer')
const xvfb = require('xvfb');


const PDFDocument = require('pdfkit');



let months        = []
let ordersByMonth  = []
let revenueByMonth = []
let totalRevenue = 0
let totalSales  = 0


////////////////////DASHBOARD/////////////////////////////

const loadDashboard = async (req, res) => {
    try {
      const sales = await Sale.find({});
  
      const salesByMonth = {};
  
      sales.forEach((sale) => {
        const monthYear = moment(sale.date).format('MMMM YYYY');
        if (!salesByMonth[monthYear]) {
          salesByMonth[monthYear] = {
            totalOrders: 0,
            totalRevenue: 0
          };
        }
        salesByMonth[monthYear].totalOrders += 1;
        salesByMonth[monthYear].totalRevenue += sale.total;
      });
  
      const chartData = [];
  
      Object.keys(salesByMonth).forEach((monthYear) => {
        const { totalOrders, totalRevenue } = salesByMonth[monthYear];
        chartData.push({
          month: monthYear.split(' ')[0],
          totalOrders: totalOrders || 0,
          totalRevenue: totalRevenue || 0
        });
      });
  
        months = [];
        ordersByMonth = [];
        revenueByMonth = [];
        totalRevenue = 0;
        totalSales = 0;
  
      chartData.forEach((data) => {
        months.push(data.month);
        ordersByMonth.push(data.totalOrders);
        revenueByMonth.push(data.totalRevenue);
        totalRevenue += Number(data.totalRevenue);
        totalSales += Number(data.totalOrders);
      });
  
      const thisMonthOrder = ordersByMonth[ordersByMonth.length - 1];
      const thisMonthSales = revenueByMonth[revenueByMonth.length - 1];
  
      res.render("admindash", {
        user: req.session.admin,
        revenueByMonth,
        months,
        ordersByMonth,
        totalRevenue,
        totalSales,
        thisMonthOrder,
        thisMonthSales,
        productUpdated:""
      });
    } catch (error) {
      console.log(error.message);
    }
};


  const chartData = async (req, res) => {
      try {
          res.json({
              months: months,
              revenueByMonth: revenueByMonth,
              ordersByMonth: ordersByMonth,
          });
      } catch (error) {
          console.log(error.message);
      }
  };

  const getSales = async (req, res) => {
      try {
          const { startDate, endDate } = req.query;

          const newstartDate = new Date(startDate);
          const newEndDate = new Date(endDate);

          const orderData = await Order.find({
              date: {
                  $gte: newstartDate,
                  $lte: newEndDate,
              },
              status: "Delivered",
          }).sort({ date: "desc" });

          const formattedOrders = orderData.map((order) => ({
              date: moment(order.date).format("YYYY-MM-DD"),
              ...order,
          }));

          let salesData = [];
          
          formattedOrders.forEach((element) => {
              salesData.push({
                  date: element.date,
                  orderId: element._doc.orderId,
                  total: element._doc.total,
                  paymentMethod: element._doc.paymentMethod,
                  productName: element._doc.product,
              });
          });

          let grandTotal = 0;

          salesData.forEach((element) => {
              grandTotal += element.total;
          });

          res.json({
              grandTotal: grandTotal,
              orders: salesData,
          });
      } catch (error) {
          console.log(error.message);
      }
  };

//checking merge code
  const downloadSalesReport = async (req, res) => {
  //   try {
  //     const orderData = req.body.orderData;
  //     const { startDate, endDate } = req.query;

  //     const xvfbOptions = {
  //         silent: true,
  //     };

  //     const browser = await puppeteer.launch({
  //         headless: true,
  //         executablePath: "/usr/bin/google-chrome-stable",
  //         args: ["--no-sandbox", "--disable-setuid-sandbox"],
  //     });

  //     const xvfbInstance = new xvfb(xvfbOptions);
  //     xvfbInstance.startSync();

  //     const page = await browser.newPage();

  //     await page.goto(
  //         `https://www.gadgetry.fun/admin/renderSalesReport?orderData=${encodeURIComponent(JSON.stringify(orderData))}
  //           &startDate=${startDate}&endDate=${endDate}`,
  //         {
  //             waitUntil: "networkidle2",
  //         }
  //     );

  //     const pdfBuffer = await page.pdf({
  //         format: "A4",
  //         printBackground: true,
  //     });

  //     await browser.close();
  //     xvfbInstance.stopSync();

  //     res.set({
  //         "Content-Type": "application/json",
  //         "Content-Disposition": `attachment; filename=SalesReport.pdf`,
  //     });

  //     res.send(pdfBuffer);
  // } catch (error) {
  //     console.log(error.message);
  // }

  try {
    const orderData = req.body.orderData;
    console.log(orderData);
    const { startDate, endDate } = req.query;

    const pdfBuffer = await generateSalesReportPDF( startDate, endDate);

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=GadgetrySalesReport.pdf`,
    });

    res.send(pdfBuffer);
} catch (error) {
    console.log(error.message);
    res.status(500).send('An error occurred');
}
  };
  
  
  const renderSalesReport = async (req, res) => {
    try {
      console.log("salesssssssss");
      const orderData = JSON.parse(decodeURIComponent(req.query.orderData)); // Parse the orderData string into an object
  
      const startDate = moment(new Date(req.query.startDate)).format('MMMM D, YYYY');
      const endDate = moment(new Date(req.query.endDate)).format('MMMM D, YYYY');
  
      const salesReportDate = moment(new Date()).format('MMMM D, YYYY');
  
      res.render('salesReport', { orderData, salesReportDate, startDate, endDate });
      console.log("reprttttttttt");
  
    } catch (error) {
      console.log(error.message);
    }
  };


  const generateSalesReportPDF = async ( startDate, endDate) => {
    const newstartDate = new Date(startDate);
    const newEndDate = new Date(endDate);
    const orderData = await Order.find({
      date: {
          $gte: newstartDate,
          $lte: newEndDate,
      },
      status: "Delivered",
  }).sort({ date: "desc" });
    return new Promise((resolve, reject) => {
      
        const doc = new PDFDocument();
        const pdfBuffer = [];

        doc.on('data', (chunk) => {
            pdfBuffer.push(chunk);
        });

        doc.on('end', () => {
            resolve(Buffer.concat(pdfBuffer));
        });

        doc.on('error', (error) => {
            reject(error);
        });

        // Customize PDF content
        doc.fontSize(18).text('Sales Report', { align: 'center' }).moveDown();
        doc.fontSize(14).text(`Start Date: ${startDate}`, { align: 'center' });
        doc.text(`End Date: ${endDate}`, { align: 'center' }).moveDown();

        // Add order data to the PDF
        doc.moveDown();
        doc.fontSize(14).text('Order Details:', { underline: true }).moveDown();

        orderData.forEach(async (order) => {
            doc.text(`Order ID: ${order.orderId}`);
          
            doc.text(`Total: ${order.total}`);
            doc.text(`Payment Method: ${order.paymentMethod}`);
            doc.text(`Status: ${order.status}`);
            doc.moveDown();

            // Add product details
            order.product.forEach(product => {
                doc.text(`Product: ${product.name}`);
                doc.text(`Price: ${product.price}`);
                doc.text(`Quantity: ${product.quantity}`);
                doc.moveDown();
            });

            doc.moveDown();
        });

        doc.end();
    });
};
  


module.exports = {
    loadDashboard,
    chartData,
    getSales,
    downloadSalesReport,
    renderSalesReport,
    generateSalesReportPDF
}