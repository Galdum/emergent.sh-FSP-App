# Forum Module Documentation

## Overview

The Forum Module provides a complete Reddit-style discussion platform exclusively for premium subscribers of the FSP Navigator application. The module includes forums, threaded discussions, nested comments, voting systems, and file attachments.

## Architecture

### Backend Components

- **Reddit Forum API** (`/backend/routes/reddit_forum.py`): RESTful API endpoints
- **Data Models** (`/backend/models.py`): Pydantic models for forums, threads, comments
- **Upload Service** (`/backend/upload_service.py`): File upload with Cloudflare R2 integration
- **Migration Script** (`/backend/scripts/seed_forums.py`): Database initialization

### Frontend Components

- **ForumModal** (`/components/ForumModal.js`): Main modal interface
- **Forum Components** (`/components/forum/`): Specialized UI components

### Database Schema

#### Forums
```
{
  id: string,
  slug: string (unique),
  title: string,
  description: string,
  premium_only: boolean,
  created_by: string,
  created_at: datetime,
  is_active: boolean
}
```

#### Threads
```
{
  id: string,
  forum_id: string,
  author_id: string,
  title: string,
  body: string,
  attachments: Attachment[],
  up_votes: number,
  down_votes: number,
  created_at: datetime,
  updated_at: datetime,
  is_locked: boolean,
  is_pinned: boolean
}
```

#### Comments
```
{
  id: string,
  thread_id: string,
  author_id: string,
  body: string,
  parent_id: string | null,
  up_votes: number,
  down_votes: number,
  created_at: datetime,
  is_deleted: boolean
}
```

#### Votes
```
{
  id: string,
  user_id: string,
  target_id: string,
  target_type: "thread" | "comment",
  value: -1 | 0 | 1,
  created_at: datetime
}
```

#### Attachments
```
{
  id: string,
  type: "image" | "file" | "link",
  url: string,
  file_name: string,
  mime_type: string,
  size: number,
  created_at: datetime
}
```

## API Endpoints

### Authentication
All endpoints require JWT authentication and premium subscription verification.

### Forums
- `GET /api/forums/` - List all forums
- `POST /api/forums/` - Create forum (admin only)
- `GET /api/forums/{slug}` - Get forum details

### Threads
- `GET /api/forums/{slug}/threads` - List threads with pagination and sorting
- `POST /api/forums/{slug}/threads` - Create new thread
- `GET /api/forums/thread/{id}` - Get thread details

### Comments
- `GET /api/forums/thread/{id}/comments` - Get comments with nested structure
- `POST /api/forums/thread/{id}/comments` - Create comment or reply

### Voting
- `POST /api/forums/thread/{id}/vote` - Vote on thread
- `POST /api/forums/comment/{id}/vote` - Vote on comment

### File Upload
- `POST /api/forums/upload` - Upload file attachment

## Environment Configuration

### Required Environment Variables

#### Cloudflare R2 (Optional - falls back to local storage)
```bash
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
```

#### Local Storage (Fallback)
```bash
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx
```

### File Upload Configuration

- **Images**: Max 5MB (jpg, jpeg, png, gif, webp)
- **Documents**: Max 10MB (pdf, doc, docx, txt, md)
- **Storage**: Cloudflare R2 with local fallback
- **Security**: File type validation, size limits

## Features

### Premium Access Control
- All forum features require active premium subscription
- Non-premium users see upgrade prompt
- Automatic subscription tier verification

### Reddit-Style Functionality
- **Voting System**: Upvote/downvote threads and comments
- **Nested Comments**: Up to 3 levels of comment threading  
- **Sorting Options**: Best, newest, oldest for both threads and comments
- **Infinite Scroll**: Pagination for thread lists

### File Attachments
- **Multi-file Support**: Attach multiple files to threads
- **Image Previews**: Thumbnail generation for images
- **Link Attachments**: External URL references
- **File Management**: Upload progress, file removal

### User Experience
- **Modal Interface**: Integrated with existing app navigation
- **Real-time Updates**: Optimistic UI updates for voting
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Comprehensive error states and recovery

## Initial Forum Setup

The system includes three pre-configured forums:

1. **General FSP / Approbation**
   - Slug: `general-fsp-approbation`
   - General discussions about the Approbation process

2. **Exemple de cazuri clinice** 
   - Slug: `exemple-cazuri-clinice`
   - Clinical case presentations and discussions

3. **Întrebări de gramatică germană**
   - Slug: `gramatica-germana`
   - German language learning support

## Installation & Setup

### 1. Database Migration
```bash
cd /app/backend
python scripts/seed_forums.py
```

### 2. Install Dependencies
```bash
# Backend
pip install boto3>=1.26.0

# Frontend dependencies are already included
```

### 3. Configure Environment
Add R2 credentials to `/app/backend/.env`:
```bash
R2_ENDPOINT=your-endpoint
R2_BUCKET=your-bucket
R2_ACCESS_KEY=your-key
R2_SECRET_KEY=your-secret
```

### 4. Restart Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## Testing

### Unit Tests
```bash
cd /app/backend
pytest tests/test_forum.py -v
```

### E2E Testing
The forum integrates with the existing testing infrastructure:
- Premium access verification
- File upload functionality  
- Voting system operation
- Comment threading

### Test Coverage
- ✅ Premium subscription verification
- ✅ Thread creation and management
- ✅ Comment system with nesting
- ✅ Voting functionality
- ✅ File upload with size limits
- ✅ API endpoint security

## Security Considerations

### Access Control
- JWT token validation on all endpoints
- Premium subscription verification
- User-specific vote tracking
- Rate limiting protection

### File Upload Security  
- File type whitelist validation
- File size limitations
- Virus scanning (recommended for production)
- Secure file storage with access controls

### Data Privacy
- User anonymization options
- GDPR compliance considerations
- Content moderation capabilities
- Data retention policies

## Performance Optimization

### Database Indexes
```javascript
// Automatically created by migration script
db.forums.createIndex({ "slug": 1 }, { unique: true })
db.threads.createIndex({ "forum_id": 1, "updated_at": -1 })
db.comments.createIndex({ "thread_id": 1, "parent_id": 1 })
db.votes.createIndex({ "user_id": 1, "target_id": 1, "target_type": 1 }, { unique: true })
```

### Caching Strategy
- Thread lists cached by forum and sort order
- Comment trees cached per thread
- Vote counts aggregated and cached
- File metadata cached after upload

### Pagination
- Thread lists: 20 items per page
- Comments: Full tree loaded (with depth limit)
- Infinite scroll for improved UX

## Monitoring & Analytics

### Key Metrics
- Daily active forum users
- Thread creation rate
- Comment engagement rate
- File upload volume
- Vote activity patterns

### Error Monitoring
- Failed file uploads
- Authentication errors  
- Database connection issues
- API endpoint failures

## Deployment Considerations

### Production Checklist
- [ ] Configure Cloudflare R2 bucket and credentials
- [ ] Set up proper file size limits
- [ ] Configure content moderation policies
- [ ] Enable database connection pooling
- [ ] Set up monitoring and alerting
- [ ] Configure backup procedures
- [ ] Test upgrade/downgrade subscription flows

### Scaling Considerations
- File storage costs and bandwidth
- Database query optimization
- CDN for file delivery
- Load balancing for API endpoints

## Troubleshooting

### Common Issues

**Forum Not Loading**
- Check premium subscription status
- Verify JWT token validity
- Confirm database connection

**File Upload Failures**
- Check file size limits
- Verify R2 credentials
- Confirm allowed file types

**Vote Counts Not Updating**
- Check optimistic UI updates
- Verify database write operations
- Confirm user authentication

### Debug Commands
```bash
# Check forum data
mongo fsp_navigator --eval "db.forums.find().pretty()"

# Verify user subscription
mongo fsp_navigator --eval "db.users.find({subscription_tier: 'PREMIUM'}).count()"

# Check upload directory
ls -la /app/uploads/

# Monitor API logs
tail -f /var/log/supervisor/backend.err.log
```

## Future Enhancements

### Planned Features
- [ ] Real-time notifications
- [ ] Search functionality
- [ ] Content moderation tools
- [ ] Mobile app integration
- [ ] Advanced user profiles
- [ ] Forum statistics dashboard

### Technical Improvements
- [ ] GraphQL API option
- [ ] WebSocket integration
- [ ] Advanced caching layer
- [ ] Image processing pipeline
- [ ] Full-text search
- [ ] Analytics dashboard

## Support & Maintenance

For technical support or feature requests, refer to the main FSP Navigator documentation or contact the development team.

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatibility**: FSP Navigator v2.0+