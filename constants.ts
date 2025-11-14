export const INITIAL_QUESTION = {
    id: 'initial',
    text: 'Chào bạn 👋! Tôi là AI Career Advisor, trợ lý hướng nghiệp của bạn. Trước khi bắt đầu, cho tôi hỏi: bạn đã có định hướng nghề nghiệp nào cho bản thân chưa?',
    options: [
        { text: 'Tôi đã có định hướng rồi', branch: 'has_direction' },
        { text: 'Tôi vẫn chưa, khá là mông lung', branch: 'no_direction' },
    ]
};
