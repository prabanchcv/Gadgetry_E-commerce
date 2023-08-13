const Category = require("../Models/categoryModel");
const SubCategory = require("../Models/subCategoryModel");
const Product = require("../Models/productModel");
const Brand = require("../Models/brandModel");
const User = require("../Models/usermodel");

////////////////////Products/////////////////////////////
var walletBalance=0
var loggedIn
const loadAllProducts = async (req, res) => {



    const categoryData = await Category.find({ is_blocked: false });
    const categoryFilterData = await Category.find({ is_blocked: false });

    const subCategoryData = await SubCategory.find();

    try {
        const page = parseInt(req.query.allProductsPage) || 1; // Get the current page number from the query parameter
        const productsPerPage = 8;

        categoryFilterData.forEach(async (category, index) => {
            const productCount = await Product.countDocuments({ category: category._id });
            categoryFilterData[index].productCount = productCount;
        });

        subCategoryData.forEach(async (subCategory, index) => {
            const productCount = await Product.countDocuments({ subCategory: subCategory._id });
            subCategoryData[index].productCount = productCount;
        });

        const brandData = await Brand.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "brand",
                    as: "products",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    productCount: { $size: "$products" },
                },
            },
        ]);

        let productData;

        const search = req.query.search;

        if (search) {
            productData = await Product.find({
                name: { $regex: ".*" + search + ".*", $options: "i" },
            })
                .skip((page - 1) * productsPerPage)
                .limit(productsPerPage);
        } else {
            productData = await Product.find()
                .skip((page - 1) * productsPerPage)
                .limit(productsPerPage);
        }

        const totalCount = search
            ? await Product.countDocuments({ name: { $regex: ".*" + search + ".*", $options: "i" } })
            : await Product.countDocuments();

        const totalPages = Math.ceil(totalCount / productsPerPage);
        console.log(req.session.user);
       

        if (req.session.user) {
            const userData=req.session.user
            const userId=userData._id;
            const user = await User.findOne({ _id: userId }).populate("cart.product").lean();
            const cart = user.cart;
           
            let subTotal = 0;
    
            cart.forEach((val) => {
                val.total = val.product.price * val.quantity;
                subTotal += val.total;
            });

            
            walletBalance=userData.wallet.balance
            res.render("allProducts", {
                loggedIn:true,
                userData,
                productData,
                categoryData,
                categoryFilterData,
                subCategoryData,
                brandData,
                currentPage: page,
                totalPages,
                walletBalance,
                subTotal,
                cart
                
            });
        } else {
            res.render("allProducts", {
                loggedIn:false,
                productData,
                categoryData,
                categoryFilterData,
                subCategoryData,
                brandData,
                currentPage: page,
                totalPages,
                walletBalance,
                subTotal:0,
                cart:{}
                
            });
        }
    } catch (error) {
        console.log(error.message);
        const userData = req.session.user;
        res.render("404", { userData, categoryData ,loggedIn:false,walletBalance,subTotal:0,cart:{}});
    }
};

const categoryFilter = async (req, res) => {
    try {
        const categoryId = req.query.categoryId;
        console.log(categoryId);
        const productData = await Product.find({ category: categoryId });
        res.json(productData);
    } catch (error) {
        console.log(error.message);
    }
};

const subCategoryFilter = async (req, res) => {
    try {
        const subCategoryId = req.query.subCategoryId;

        const productData = await Product.find({ subCategory: subCategoryId });
        console.log(productData);
        res.json(productData);
    } catch (error) {
        console.log(error.message);
    }
};

const brandFilter = async (req, res) => {
    try {
        const brandId = req.query.brandId;

        const productData = await Product.find({ brand: brandId });
        res.json(productData);
    } catch (error) {
        console.log(error.message);
    }
};

const sortProduct = async (req, res) => {
    try {
        const sort = req.body.sort;
        const productData = await Product.find().sort({ price: sort });
        res.json(productData);
    } catch (error) {
        console.log(error.message);
    }
};

const loadProducts = async (req, res) => {
    const categoryData = await Category.find({ is_blocked: false });
    const subCategoryData = await SubCategory.find();
    
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number from the query parameter
        const productsPerPage = 8;

        subCategoryData.forEach(async (subCategory, index) => {
            const productCount = await Product.countDocuments({ subCategory: subCategory._id });
            subCategoryData[index].productCount = productCount;
        });

        const brandData = await Brand.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "brand",
                    as: "products",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    productCount: { $size: "$products" },
                },
            },
        ]);

        const id = req.query.id;
        let productData;
        let totalCount

        
            const isCategory = await Category.exists({ _id: id });

            if (isCategory) {
                productData = await Product.find({ category: id })
                    .skip((page - 1) * productsPerPage)
                    .limit(productsPerPage);
                
                totalCount = await Product.countDocuments({ category: id });
            } else {
                productData = await Product.find({ subCategory: id })
                    .skip((page - 1) * productsPerPage)
                    .limit(productsPerPage);

                totalCount = await Product.countDocuments({ subCategory: id });
            }
        
      
        
        const totalPages = Math.ceil(totalCount / productsPerPage);

        const userData = req.session.user;
        

      
        if (userData){
            walletBalance=userData.wallet.balance
            console.log(userData);
        const userId=userData._id;
        const user = await User.findOne({ _id: userId }).populate("cart.product").lean();
        const cart = user.cart;
       
        let subTotal = 0;

        cart.forEach((val) => {
            val.total = val.product.price * val.quantity;
            subTotal += val.total;
        });
       return  res.render("products", {
            id,
            productData,
            categoryData,
            userData,
            subCategoryData,
            brandData,
            currentPage: page,
            totalPages,
            loggedIn:true,
            walletBalance,
            cart,
            subTotal
        });

        }else{
            res.render("products", {
                id,
                productData,
                categoryData,
                userData,
                subCategoryData,
                brandData,
                currentPage: page,
                totalPages,
                loggedIn:false,
                walletBalance,
                cart:{},
                subTotal:0
            });
        }
       
    } catch (error) {
        console.log(error.message);
        const userData = req.session.user;
        res.render("404", { userData, categoryData ,subTotal:0,cart:{}});
    }
};


const offerProducts = async (req, res) => {
    const categoryData = await Category.find({ is_blocked: false });
    const subCategoryData = await SubCategory.find();

    try {
        const page = parseInt(req.query.offerPage) || 1; // Get the current page number from the query parameter
        const productsPerPage = 8;

        subCategoryData.forEach(async (subCategory, index) => {
            const productCount = await Product.countDocuments({ subCategory: subCategory._id });
            subCategoryData[index].productCount = productCount;
        });

        const brandData = await Brand.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "brand",
                    as: "products",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    productCount: { $size: "$products" },
                },
            },
        ]);

        const offerlabel = req.query.label;

        const productData = await Product.find({ offerlabel: { $in: offerlabel } })
            .skip((page - 1) * productsPerPage)
            .limit(productsPerPage);

        const totalCount = await Product.countDocuments({ offerlabel: { $in: offerlabel } });
        const totalPages = Math.ceil(totalCount / productsPerPage);

        const userData = req.session.user;
        
        var val;
        let subTotal = 0;
        if(userData){
            const userId=userData._id;
            const user = await User.findOne({ _id: userId }).populate("cart.product").lean();



            const cart = user.cart;
           
          
    
            cart.forEach((val) => {
                val.total = val.product.price * val.quantity;
                subTotal += val.total;
            });
            val=true
            walletBalance=userData.wallet.balance

            res.render("offerProducts", {
                cart,
                subTotal,
                walletBalance,
                loggedIn:true,
                productData,
                categoryData,
                userData,
                subCategoryData,
                brandData,
                currentPage: page,
                totalPages,
                offerHeading:`${offerlabel} offer`
            });
        }else{
            res.render("offerProducts", {
                cart:{},
                subTotal,
                walletBalance,
                loggedIn:false,
                productData,
                categoryData,
                userData,
                subCategoryData,
                brandData,
                currentPage: page,
                totalPages,
                offerHeading:`${offerlabel} offer`
            });

        }
        
      
    } catch (error) {
        console.log(error.message);
        const userData = req.session.user;
        res.render("404", { userData, categoryData });
    }
};



const productView = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number from the query parameter
        const productsPerPage = 8;
        let relatedProducts;
         const id = req.query.id;
        const isCategory = await Category.exists({ _id: id });

        var obj=`"${id}"`
            // Get the product id from the query string
            
            var id_curr = `ObjectId(${obj})`;
          
            // Get the category name from the product
            var categoryName = await Product.findOne({id: id_curr}, {category: 1});
          
            // Get all the products from MongoDB which are related to the category
             relatedProducts = await Product.find({category: categoryName});
          
            // Return the related products
          
    

        
        const productId = req.query.id;
       
       
        const productData = await Product.findById(productId);
        console.log(productData);
        const categoryData = await Category.find({ is_blocked: false });
        const subCategoryData = await SubCategory.find();
        const brandData = await Brand.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "brand",
                    as: "products",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    productCount: { $size: "$products" },
                },
            },
        ]);
        if (req.session.user) {
            const userData = req.session.user;
            const userId = userData._id;
            const user = await User.findOne({ _id: userId }).populate("cart.product").lean();



             const cart = user.cart;
            
             let subTotal = 0;
     
             cart.forEach((val) => {
                 val.total = val.product.price * val.quantity;
                 subTotal += val.total;
             });
             walletBalance=userData.wallet.balance
            let cartId = null;
        
         
   
            if (user.cart && user.cart.length > 0) {
                cartId = user.cart[0]._id;

                if (!productData) {
                    res.render("404", { userData });
                } else res.render("productView", { productData, subCategoryData,brandData ,cartId, categoryData, userData,loggedIn:true ,relatedProducts ,  walletBalance,cart,subTotal});
            } else {
                res.render("productView", { productData, categoryData ,subCategoryData,brandData , userData ,loggedIn:true,cartId,relatedProducts,  walletBalance,subTotal:0,cart:{}});
            }
        } else {

            if (!productData) {
                res.render("404", { categoryData,subTotal:0,cart:{} });
              
            } else{
               
             res.render("productView", { productData, subCategoryData,brandData , categoryData ,loggedIn:false,userData:false,relatedProducts,  walletBalance,subTotal:0,cart:{}});

            }
        }
    } catch (error) {
        
        console.log(error.message);
        const userData = req.session.user;
        var val=(userData)?true:false
        const categoryData = await Category.find({ is_blocked: false });
        
        res.render("404", { userData, categoryData ,loggedIn:val,  walletBalance,subTotal:0,cart:{}});
    }
};

module.exports = {
    loadAllProducts,
    loadProducts,
    productView,
    offerProducts,


    categoryFilter,
    subCategoryFilter,
    brandFilter,
    sortProduct,
};
