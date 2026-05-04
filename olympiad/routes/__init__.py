def register_routes(app):
    from olympiad.routes import admin, api, auth, pages

    auth.register(app)
    pages.register(app)
    api.register(app)
    admin.register(app)
