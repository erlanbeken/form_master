from django.views.generic import View
from django.http import JsonResponse, Http404
from django.shortcuts import redirect
import json

class REST(View):
    entity_class   = None
    login_required = False
    entity_fields  = []

    def entity_check(self):
        return True

    def populate_entity(self, additional_attributes):
        for field in self.entity_fields:
            setattr(self.entity, field, self.data.get(field, None))

        if additional_attributes:
            for key, value in additional_attributes.items():
                setattr(self.entity, key, value)

    def dispatch(self, request, *args, **kwargs):
        try:
            self.user = request.user

            if self.login_required and not self.user.id:
                return redirect('/')

            if request.body:
                self.data = json.loads(request.body)

            if len(args) and args[0]:
                self.entity = self.entity_class.objects.get(pk=args[0])
                self.entity_check(self.entity)

            result = {
                'status': 'OK',
                'result': getattr(self, request.method)()
            }
        except AttributeError as e:
            print e
            raise Http404('Method not implemented')
        except Exception as e:
            result = {
                'status': 'Failed',
                'result': str(e)
            }

        return JsonResponse(result, safe=False)

    def GET(self, **kwargs):
        return {item.id : item.get_public_data() for item in self.entity_class.objects.filter(**kwargs)}

    def PUT(self, **kwargs):
        self.populate_entity(kwargs)
        self.entity.save()

    def POST(self, **kwargs):
        self.entity = self.entity_class()
        self.populate_entity(kwargs)
        self.entity.save()
        return self.entity.id

    def DELETE(self):
        self.entity.delete()