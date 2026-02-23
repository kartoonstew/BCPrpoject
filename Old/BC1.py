import json

try:
    with open("BC_Compendium.json", "r") as file:
        index = json.load(file)
except FileNotFoundError:
    print("Compendium file not found. Check the file path.")
    exit()
        
def sub(info): #handles individual subclasses + morale, black banner, commissary as lists with their features
    for x in index:
        if info == x.lower():
            print(f'{info.title()}:')
            print(f'{index[x]["description"]}\n')
            for y in index[x]['features']:
                print(f'{y.title()}:')
                print(f'{index[x]["features"][y]["description"]:}\n')
        for y in index[x]:
            if info == y.lower():
                print(f'\n{info.title()}: {index[x][y]["description"]}\n')
                for feat in index[x][y]['features']:
                    print(feat.title())
                    print(f'Level: {index[x][y]["features"][feat]["level"]}')
                    print(f'{index[x][y]["features"][feat]["description"]}\n')

def list_section(section): #handles lists of traits, quirks, subclasses (but no subclass info)
    for x in index[section]:
        print(f'{x.title()}:')
        print(f'{index[section][x]["description"]}\n')

def single_info(single): #handles searching individual quirks and traits
    for x in index:
        if single in index[x]:
            print(f'{single.title()}:')
            print(f'{index[x][single]["description"]}')
                
while True:
    choice = input("Make a choice, or type quit: ").strip().lower()
    if choice == "quit":
        print("Did you know that Smalley and Oscar used to make love during their time in the navy? Ok, bye.")
        break
    elif choice in index["subclasses"]:
        sub(choice)
    elif choice == "traits" or choice == "quirks" or choice == "subclasses":
        list_section(choice)
    elif choice == "morale" or choice == "commissary" or choice == "black banner" or choice == "brothers":
        sub(choice)
    elif choice in index["traits"] or choice in index["quirks"]:
        single_info(choice)
    else:
        print("You, the user, absolutely fucked something up. This is not on me.")


