import dash
from dash.dependencies import Input, Output
import dash_html_components as html
import dash_core_components as dcc
import json
from dash_network import Network

app = dash.Dash(__name__)

app.scripts.config.serve_locally = True
app.css.config.serve_locally = True


with open('force_graph_data.json') as json_file:
    data = json.load(json_file)

with open('force_graph_data1.json') as json_file:
    data1 = json.load(json_file)

with open('force_graph_data2.json') as json_file:
    data2 = json.load(json_file)

print(data)
app.layout = html.Div([    dcc.Dropdown(
        id='data-dropdown',
        options=[
            {'label': 'data', 'value': 'data'},
            {'label': 'data1', 'value': 'data1'},
            {'label': 'data2', 'value': 'data2'}
        ],
        value='data'
    ),
    html.H2('Click a node to expand it, or the background to return'),
    html.Div([
    Network(
        id='net',
        data=data,height=550, width=1200, nodeRadius=17)],className="row", style ={'textAlign': 'center'}),
    # html.Div(id='output')
])

@app.callback(Output('net', 'data'),
              [Input('data-dropdown', 'value')])
def update_data(data_s):
	if data_s == 'data':
	    return data
	elif data_s == 'data1':
	    return data1
	elif data_s == 'data2':
	    return data2

# @app.callback(Output('output', 'children'),
#               [Input('net', 'selectedId'), Input('net', 'data')])
# def list_connections(selected_id, data):
#     return 'You selected node "{}" on a graph with {} nodes and {} links'.format(
#         selected_id, len(data['nodes']), len(data['links']))

if __name__ == '__main__':
    app.run_server(debug=True, port=8051)
