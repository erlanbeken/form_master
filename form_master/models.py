from django.db import models
from django.contrib.auth.models import User

class Website(models.Model):
    name = models.CharField(max_length=30)
    url  = models.CharField(max_length=200)
    user = models.ForeignKey(User)

    def get_public_data(self):
        return {'id': self.id, 'name': self.name, 'url': self.url}


class Form(models.Model):
    name    = models.CharField(max_length=30)
    website = models.ForeignKey(Website)
    content = models.TextField(null=True)

    def get_public_data(self):
        return {'id': self.id, 'name': self.name, 'website_id': self.website.id, 'content': self.content}