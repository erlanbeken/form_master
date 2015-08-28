from django.conf.urls import include, url, patterns
from django.contrib import admin

from django.conf import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

import os

from .views import Websites, Forms

admin.autodiscover()

urlpatterns = [
    # Examples:
    # url(r'^$', 'form_master.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', 'form_master.views.home', name='home'),
    url(r'^logout/$', 'django.contrib.auth.views.logout',{'next_page': '/'}),
    url(r'^customer/$', 'form_master.views.customer', name='customer'),
    url(r'^websites/(\d+)?$', Websites.as_view(), name='websites'),
    url(r'^forms/(\d+)?$', Forms.as_view(), name='forms'),
]
