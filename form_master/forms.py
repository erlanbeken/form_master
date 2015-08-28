from django import forms

class AuthForm(forms.Form):
    email    = forms.EmailField(label='')
    password = forms.CharField(label='', widget=forms.PasswordInput())