const TelegramBot = require('node-telegram-bot-api');

// ၁။ BotFather မှ ရရှိထားသော Token
const TOKEN = '8982203850:AAFWZQKhrYNBQix5qXJM0bv3J0-Fe_J1hUg';

// ၂။ အထက်ပါ အဆင့် (၁) မှ ရရှိသော သင့် Telegram ID (ဥပမာ - 123456789)
const ADMIN_CHAT_ID = '123456789';

const bot = new TelegramBot(TOKEN, { polling: true });

// Web App မီနူး ခလုတ် ပြသပေးခြင်း
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "မင်္ဂလာပါ၊ စျေးဝယ်ယူရန် အောက်ပါ ခလုတ်ကို နှိပ်ပါ -", {
        reply_markup: {
            keyboard: [[
                {
                    text: "🛍️ Open Shop",
                    web_app: { url: "https://github.com/shinkhant17304/O_shop_project.git" } // သင့် Vercel Link အစားထိုးပါ
                }
            ]],
            resize_keyboard: true
        }
    });
});

// Web App မှ ပို့လိုက်သော အော်ဒါ အချက်အလက်များကို လက်ခံရယူခြင်း
bot.on('message', (msg) => {
    if (msg.web_app_data) {
        try {
            const order = JSON.parse(msg.web_app_data.data);
            
            const itemList = order.items.map(i => `- ${i.name}: ${i.price} KS`).join('\n');
            const message = `🚨 **အော်ဒါအသစ် ရရှိပါသည်!**\n\n` +
                            `👤 အမည်: ${order.customer.name}\n` +
                            `📞 ဖုန်း: ${order.customer.phone}\n` +
                            `📍 လိပ်စာ: ${order.customer.address}\n\n` +
                            `🛒 **ဝယ်ယူသည့် ပစ္စည်းများ:**\n${itemList}\n\n` +
                            `💰 **စုစုပေါင်း ကျသင့်ငွေ:** ${order.total.toLocaleString()} KS`;

            // ဝယ်ယူသူထံ အတည်ပြုချက် ပို့ပေးခြင်း
            bot.sendMessage(msg.chat.id, `ကျေးဇူးတင်ပါသည် ${order.customer.name}၊ သင့်အော်ဒါကို လက်ခံရရှိပါပြီ!`);
            
            // Admin ထံသို့ အော်ဒါအသေးစိတ် မက်ဆေ့ဂျ် ပို့ပေးခြင်း
            bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });

        } catch (e) {
            console.error("Data parse error:", e);
        }
    }
});
