const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// ၁။ Bot Configuration
const TOKEN = '8982203850:AAFWZQKhrYNBQix5qXJM0bv3J0-Fe_J1hUg';
const ADMIN_CHAT_ID = '8704594334';

// ၂။ MongoDB Database ချိတ်ဆက်ခြင်း
// (အောက်ပါလင့်ခ်နေရာတွင် သင့် MongoDB Connection String နှင့် Password အစားထိုးပါ)
const MONGO_URI = 'mongodb+srv://shinekhant69444_db_user:8rNEBffwEyj4pvh4@cluster0.ruvagwt.mongodb.net/?appName=Cluster0';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Database ချိတ်ဆက်မှု အဆင်ပြေပါသည်!'))
    .catch(err => console.error('❌ Database ချိတ်ဆက်မှု အမှား:', err));

// ၃။ Database ထဲတွင် သိမ်းဆည်းမည့် Order ပုံစံ (Schema)
const orderSchema = new mongoose.Schema({
    customerName: String,
    customerPhone: String,
    customerAddress: String,
    items: Array,
    totalAmount: Number,
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

const bot = new TelegramBot(TOKEN, { polling: true });

// ၄။ Web App မီနူး ခလုတ် ပြသပေးခြင်း
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "မင်္ဂလာပါ၊ စျေးဝယ်ယူရန် အောက်ပါ ခလုတ်ကို နှိပ်ပါ -", {
        reply_markup: {
            keyboard: [[
                {
                    text: "🛍️ Open Shop",
                    web_app: { url: "https://shinkhant17304.github.io/O_shop_project/" }
                }
            ]],
            resize_keyboard: true
        }
    });
});

// ၅။ Web App မှ ပို့လိုက်သော အော်ဒါကို လက်ခံပြီး Database ထဲ သိမ်းဆည်းခြင်း
bot.on('message', async (msg) => {
    if (msg.web_app_data) {
        try {
            const order = JSON.parse(msg.web_app_data.data);
            
            // (က) Database ထဲသို့ အော်ဒါ သိမ်းဆည်းခြင်း
            const newOrder = new Order({
                customerName: order.customer.name,
                customerPhone: order.customer.phone,
                customerAddress: order.customer.address,
                items: order.items,
                totalAmount: order.total
            });
            await newOrder.save();
            console.log("💾 အော်ဒါကို Database ထဲသို့ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!");

            // (ခ) မက်ဆေ့ဂျ် ပြင်ဆင်ခြင်း
            const itemList = order.items.map(i => `- ${i.name}: ${i.price} KS`).join('\n');
            const message = `🚨 **အော်ဒါအသစ် ရရှိပါသည်! (DB တွင် သိမ်းပြီး)**\n\n` +
                            `👤 အမည်: ${order.customer.name}\n` +
                            `📞 ဖုန်း: ${order.customer.phone}\n` +
                            `📍 လိပ်စာ: ${order.customer.address}\n\n` +
                            `🛒 **ဝယ်ယူသည့် ပစ္စည်းများ:**\n${itemList}\n\n` +
                            `💰 **စုစုပေါင်း ကျသင့်ငွေ:** ${order.total.toLocaleString()} KS`;

            // (ဂ) ဝယ်ယူသူထံ အကြောင်းကြားစာ ပို့ခြင်း
            bot.sendMessage(msg.chat.id, `ကျေးဇူးတင်ပါသည် ${order.customer.name}၊ သင့်အော်ဒါကို လက်ခံရရှိပါပြီ!`);
            
            // (ဃ) Admin ထံသို့ အော်ဒါအသေးစိတ် မက်ဆေ့ဂျ် ပို့ခြင်း
            bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });

        } catch (e) {
            console.error("Order save error:", e);
        }
    }
});

// ၆။ Admin မှ /orders ဟု ရိုက်ပါက မကြာသေးမီက အော်ဒါ (၁၀) ခု ပြသပေးခြင်း
bot.onText(/\/orders/, async (msg) => {
    if (msg.chat.id.toString() !== ADMIN_CHAT_ID) return;

    try {
        const orders = await Order.find().sort({ createdAt: -1 }).limit(10);

        if (orders.length === 0) {
            return bot.sendMessage(msg.chat.id, "❌ အော်ဒါ မှတ်တမ်း မရှိသေးပါ။");
        }

        let response = "📦 **နောက်ဆုံး ရရှိထားသော အော်ဒါများ:**\n\n";
        orders.forEach((o, index) => {
            response += `${index + 1}. **${o.customerName}** (${o.customerPhone})\n`;
            response += `📍 ${o.customerAddress}\n`;
            response += `💰 စုစုပေါင်း: ${o.totalAmount.toLocaleString()} KS\n`;
            response += `📅 ရက်စွဲ: ${o.createdAt.toLocaleDateString()}\n------------------\n`;
        });

        bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown' });
    } catch (err) {
        bot.sendMessage(msg.chat.id, "❌ အော်ဒါများ ဆွဲယူရာတွင် အမှားဖြစ်ပေါ်နေပါသည်။");
    }
});
