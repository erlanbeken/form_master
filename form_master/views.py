from django import views

from .forms import AuthForm
from .models import Website, Form
from .REST import REST

from django.shortcuts import render, redirect

from django.contrib.auth.models import User
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required

from django.core.exceptions import ObjectDoesNotExist

def home(request):
    error = False
    if request.method == 'POST':
        try:
            form = AuthForm(request.POST)
            if not form.is_valid():
                raise Exception('Invalid form')

            data = form.cleaned_data
            try:
                user = User.objects.get(email=data['email'])
                if not user.check_password(data['password']):
                    raise Exception('Wrong password')
            except ObjectDoesNotExist:
                user = User.objects.create_user(data['email'], data['email'], data['password'])

            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user)
            return redirect('customer')
        except Exception as error:
            pass
    else:
        if request.user.is_authenticated():
            return redirect('customer')
        form = AuthForm()

    return render(request, 'home.html', {'form': form, 'error': error})

@login_required
def customer(request):
    return render(request, 'customer.html')


class Websites(REST):
    entity_class   = Website
    login_required = True
    entity_fields  = ['url', 'name']

    def entity_check(self, entity):
        if entity.user != self.user:
            raise Exception('Wrong user')

    def GET(self):
        return super(Websites, self).GET(user=self.user)

    def POST(self):
        return REST.POST(self, user=self.user)

class Forms(REST):
    entity_class   = Form
    login_required = True
    entity_fields  = ['name', 'website_id', 'content']

    def entity_check(self, entity):
        if entity.website.user != self.user:
            raise Exception('Wrong user')

    def GET(self):
        return super(Forms, self).GET(website__user=self.user)
