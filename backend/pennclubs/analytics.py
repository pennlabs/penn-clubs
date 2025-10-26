from analytics.analytics import Product, get_analytics_recorder


# Creates a singleton of of the 'AnalyticsRecorder' class
LabsAnalytics = get_analytics_recorder(Product.CLUBS)
