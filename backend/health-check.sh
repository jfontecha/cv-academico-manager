# Health check endpoint for monitoring
endpoint=https://cv-academico-backend.onrender.com/api
timeout=30

echo "🏥 Health check starting..."
echo "Testing endpoint: $endpoint"

response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time $timeout)

if [ "$response" = "200" ] || [ "$response" = "404" ]; then
    echo "✅ Backend is healthy (HTTP $response)"
    exit 0
else
    echo "❌ Backend health check failed (HTTP $response)"
    exit 1
fi