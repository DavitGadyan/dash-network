# AUTO GENERATED FILE - DO NOT EDIT

from dash.development.base_component import Component, _explicitize_args


class SVGIcon(Component):
    """A SVGIcon component.
SVGIcon component, based on D3 force layout

Keyword arguments:
"""
    @_explicitize_args
    def __init__(self, name=Component.UNDEFINED, style=Component.UNDEFINED, fill=Component.UNDEFINED, viewBox=Component.UNDEFINED, width=Component.UNDEFINED, className=Component.UNDEFINED, height=Component.UNDEFINED, **kwargs):
        self._prop_names = []
        self._type = 'SVGIcon'
        self._namespace = 'dash_network'
        self._valid_wildcard_attributes =            []
        self.available_properties = []
        self.available_wildcard_properties =            []

        _explicit_args = kwargs.pop('_explicit_args')
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs
        args = {k: _locals[k] for k in _explicit_args if k != 'children'}

        for k in []:
            if k not in args:
                raise TypeError(
                    'Required argument `' + k + '` was not specified.')
        super(SVGIcon, self).__init__(**args)
