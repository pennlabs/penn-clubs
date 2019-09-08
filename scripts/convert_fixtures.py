#!/usr/bin/env python3

# Used to convert a fixture to the new club id format where the slug is no longer the id.
# Renames the slug id to code and generates a sequential integer primary key.
# Prints the modified json file to stdout.
# Should only need to be run once and never again.

import json
import sys


def convert_fixtures(fixtures):
    out = []
    id_mapping = {}
    id_count = 1
    for fixture in fixtures:
        model = fixture['model']
        if model.startswith('clubs.'):
            if model == 'clubs.club':
                slug = fixture['pk']
                if slug not in id_mapping:
                    new_id = id_count
                    id_mapping[slug] = new_id
                    id_count += 1
                else:
                    new_id = id_mapping[slug]
                fixture['pk'] = new_id
                fixture['fields']['code'] = slug
            elif model in ['clubs.tag']:
                pass
            elif model in ['clubs.favorite', 'clubs.membership', 'clubs.membershipinvite']:
                fixture['fields']['club'] = id_mapping[fixture['fields']['club']]
            else:
                raise NotImplementedError('No handler for {}!'.format(model))
            out.append(fixture)
        elif model.startswith('contenttypes') or model == 'auth.permission':
            pass
        else:
            out.append(fixture)
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: {} <fixtures json>'.format(sys.argv[0]))
        exit(1)
    with open(sys.argv[1], 'r') as f:
        data = json.load(f)
    data = convert_fixtures(data)
    print(json.dumps(data, indent=4))
