
import './CommentItem.css';

export default function CommentItem({ comment }) {
    const date = new Date(comment.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="comment-item fade-in">
            <div className="comment-header">
                <span className="comment-author">👤 {comment.author_username || comment.user_id?.slice(0, 8)}...</span>
            </div>
            <p className="comment-body">{comment.body}</p>
            <span className="comment-date">{date}</span>
        </div>
    );
}
