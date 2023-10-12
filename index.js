require('dotenv').config();
const { 
    Bot, 
    Keyboard,
    InlineKeyboard,
    GrammyError,
    HttpError,
} = require('grammy');
const { getRandomQuestion, getCorrectAnswer } = require('./utils');

const bot = new Bot (process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
    const startKeyBoard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('TypeScript')
    .row()
    .text('React')
    .text('NodeJs')
    .row()
    .text('Случайный вопрос')
    .resized();
    await ctx.reply(
        'Привет! Я - Frontend Bot \nIvlev Tech TOP\n👾👾👾👾👾', 
        );
    await ctx.reply('С чего начнём? Выбери тему вопроса в меню 👇🏻', {
        reply_markup: startKeyBoard,
    });
});

bot.hears(
    ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'NodeJs', 'Случайный вопрос'], 
    async (ctx) => {
        const topic = ctx.message.text.toLowerCase();
        const { question, questionTopic } = getRandomQuestion(topic);

        let inlineKeyboard;

        if (question.hasOptions) {
            const buttonRows = question.options.map((option) => [
                InlineKeyboard.text(
                    option.text, 
                    JSON.stringify({
                    type: `${questionTopic}-option`,
                    isCorrect: option.isCorrect,
                    questionId: question.id,
                }),
            ),
        ]);

        inlineKeyboard = InlineKeyboard.from(buttonRows);
    } else {
        inlineKeyboard = new InlineKeyboard().text(
            'Узнать ответ',
            JSON.stringify({
            type: questionTopic,
            questionId: question.id,
        }),
        );
    };
        await ctx.reply(question.text, {
            reply_markup: inlineKeyboard,
        });
    },
    );

bot.on('callback_query:data', async (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);

    if (!callbackData.type.includes('option')) {
        const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
        await ctx.reply(answer, {
            parse_mode: 'HTML', 
            disable_web_page_preview: true,
        });
        await ctx.answerCallbackQuery();
        return;
    }

    if (callbackData.isCorrect) {
        await ctx.reply('Верно ✔️');
        await ctx.answerCallbackQuery();
        return;
    }

    const answer = getCorrectAnswer(
        callbackData.type.split('-')[0], 
        callbackData.questionId
    );
    await ctx.reply(`Неверно ✖️ Правильный ответ: ${answer} `);
    await ctx.answerCallbackQuery();
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Ошибка обновления ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Ошибка в запросе:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Ошибка с сетью Телеграмм:", e);
    } else {
      console.error("Неизвестная ошибка:", e);
    }
  });

bot.start();
