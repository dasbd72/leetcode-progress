import boto3

def migrate_data(source_table_name, dest_table_name):
    dynamodb = boto3.resource('dynamodb')
    source_table = dynamodb.Table(source_table_name)
    dest_table = dynamodb.Table(dest_table_name)

    # Scan the source table
    response = source_table.scan()
    items = response['Items']

    # Paginate through all items if the table is large
    while 'LastEvaluatedKey' in response:
        response = source_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])

    # Write each item to the destination table
    with dest_table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)

    print(f"Successfully migrated {len(items)} items from {source_table_name} to {dest_table_name}")

if __name__ == "__main__":
    source_table_name = "LeetCodeProgress"
    dest_table_name = "LeetCodeProgress-s8nczw"
    migrate_data(source_table_name, dest_table_name)
