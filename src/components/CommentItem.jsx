import './CommentItem.css';

export default function CommentItem({ comment }) {
    const authorName = comment.author_username || `${comment.user_id?.slice(0, 8) || 'Unknown'}...`;
    const date = new Date(comment.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <article className="comment-item fade-in">
            <header className="comment-header">
                <span className="comment-avatar" aria-hidden="true">
                    {authorName.charAt(0).toUpperCase()}
                </span>
                <span className="comment-author">{authorName}</span>
                <time className="comment-date" dateTime={comment.created_at}>{date}</time>
            </header>
            <p className="comment-body">{comment.body}</p>
        </article>
    );
}
